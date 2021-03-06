import { BaseHelper } from "./base_helper";
import { IError } from "../interfaces";
import { WhereChecker } from "./where_checker";
import { IdbHelper } from "./idb_helper";
import { LogHelper } from "../log_helper";
import { ERROR_TYPE, OCCURENCE, DATA_TYPE } from "../enums";
import { Column } from "../model/column";
import { QUERY_OPTION } from "../enums";

export class Base extends BaseHelper {
    error: IError;
    errorOccured = false;
    errorCount = 0;
    rowAffected = 0;
    onSuccess: (result?) => void;
    onError: (err: IError) => void;
    objectStore: IDBObjectStore;
    query;
    whereCheckerInstance: WhereChecker;
    tableName: string;
    isTransaction: boolean;
    cursorOpenRequest: IDBRequest;
    checkFlag = false;
    skipRecord;
    limitRecord;

    protected onCursorError = (e) => {
        this.errorOccured = true;
        this.onErrorOccured(e);
    }


    protected onErrorOccured(e, customError = false) {
        ++this.errorCount;
        if (this.errorCount === 1) {
            if (customError) {
                e.logError();
                this.onError((e as LogHelper).get());
            }
            else {
                const error = new LogHelper((e as any).target.error.name);
                error.message = (e as any).target.error.message;
                error.logError();
                this.onError(error.get());
            }
        }
    }

    protected onExceptionOccured(ex: DOMException, info) {
        switch (ex.name) {
            case 'NotFoundError':
                const error = new LogHelper(ERROR_TYPE.TableNotExist, info);
                this.onErrorOccured(error, true);
                break;
            default: console.error(ex);
        }
    }

    protected getColumnInfo(columnName) {
        let columnInfo: Column;
        this.getTable(this.tableName).columns.every((column) => {
            if (column.name === columnName) {
                columnInfo = column;
                return false;
            }
            return true;
        });
        return columnInfo;
    }

    protected addGreatAndLessToNotOp() {
        const whereQuery = this.query.where;
        const containsNot = (qry: object, keys: string[]) => {
            return keys.findIndex(key => qry[key][QUERY_OPTION.NotEqualTo] != null) >= 0;
        };
        const addToSingleQry = (qry, keys: string[]) => {
            let value;
            keys.forEach((prop) => {
                value = qry[prop];
                if (value[QUERY_OPTION.NotEqualTo] != null) {
                    qry[prop][QUERY_OPTION.GreaterThan] = value[QUERY_OPTION.NotEqualTo];
                    if (qry[QUERY_OPTION.Or] === undefined) {
                        qry[QUERY_OPTION.Or] = {};
                        qry[QUERY_OPTION.Or][prop] = {};
                    }
                    else if (qry[QUERY_OPTION.Or][prop] === undefined) {
                        qry[QUERY_OPTION.Or][prop] = {};
                    }
                    qry[QUERY_OPTION.Or][prop][QUERY_OPTION.LessThan] = value[QUERY_OPTION.NotEqualTo];
                    delete qry[prop][QUERY_OPTION.NotEqualTo];
                }
            });
            return qry;
        };
        if (this.getType(whereQuery) === DATA_TYPE.Object) {
            const queryKeys = Object.keys(whereQuery);
            if (containsNot(whereQuery, queryKeys)) {
                if (queryKeys.length === 1) {
                    this.query.where = addToSingleQry(whereQuery, queryKeys);
                }
                else {
                    const whereTmp = [];
                    queryKeys.forEach((prop) => {
                        whereTmp.push(addToSingleQry({ [prop]: whereQuery[prop] }, [prop]));
                    });
                    this.query.where = whereTmp;
                }
            }
        }
        else {
            const whereTmp = [];
            (whereQuery as object[]).forEach(qry => {
                const queryKeys = Object.keys(qry);
                if (containsNot(qry, queryKeys)) {
                    qry = addToSingleQry(qry, queryKeys);
                }
                whereTmp.push(qry);
            });
            this.query.where = whereTmp;
        }
    }

    protected goToWhereLogic = function () {
        const columnName = this.getObjectFirstKey(this.query.where);
        if (this.query.ignoreCase === true) {
            this.query.where = this.makeQryInCaseSensitive(this.query.where);
        }
        if (this.objectStore.indexNames.contains(columnName)) {
            const value = this.query.where[columnName];
            if (typeof value === 'object') {
                this.checkFlag = Boolean(
                    Object.keys(value).length > 1 ||
                    Object.keys(this.query.where).length > 1
                );
                if (this.checkFlag === true) {
                    this.whereCheckerInstance = new WhereChecker(this.query.where);
                }
                const key = this.getObjectFirstKey(value);
                switch (key) {
                    case QUERY_OPTION.Like: {
                        const filterValues = value[QUERY_OPTION.Like].split('%');
                        let filterValue: string,
                            occurence: OCCURENCE;
                        if (filterValues[1]) {
                            filterValue = filterValues[1];
                            occurence = filterValues.length > 2 ? OCCURENCE.Any : OCCURENCE.Last;
                        }
                        else {
                            filterValue = filterValues[0];
                            occurence = OCCURENCE.First;
                        }
                        if (occurence === OCCURENCE.First) {
                            this.getAllCombinationOfWord(filterValue).forEach((item) => {
                                this.executeWhereLogic(columnName,
                                    { '-': { low: item, high: item + '\uffff' } },
                                    '-');
                            });
                            delete this.query.where[columnName][QUERY_OPTION.Like];
                        }
                        else {
                            this.executeLikeLogic(columnName, filterValue, occurence);
                        }
                    } break;
                    case QUERY_OPTION.In:
                        this.executeInLogic(columnName, value[QUERY_OPTION.In]);
                        break;
                    case QUERY_OPTION.Between:
                    case QUERY_OPTION.GreaterThan:
                    case QUERY_OPTION.LessThan:
                    case QUERY_OPTION.GreaterThanEqualTo:
                    case QUERY_OPTION.LessThanEqualTo:
                        this.executeWhereLogic(columnName, value, key);
                        break;
                    case QUERY_OPTION.Aggregate: break;
                    default: this.executeWhereLogic(columnName, value);
                }
            }
            else {
                this.checkFlag = Boolean(Object.keys(this.query.where).length > 1);
                if (this.checkFlag === true) {
                    this.whereCheckerInstance = new WhereChecker(this.query.where);
                }
                this.executeWhereLogic(columnName, value);
            }
        }
        else {
            this.errorOccured = true;
            const column: Column = this.getColumnInfo(columnName);
            const error = column == null ?
                new LogHelper(ERROR_TYPE.ColumnNotExist, { ColumnName: columnName }) :
                new LogHelper(ERROR_TYPE.EnableSearchOff, { ColumnName: columnName });

            this.onErrorOccured(error, true);
        }
    };

    protected makeQryInCaseSensitive(qry) {
        let results = [];
        let columnValue,
            keyValue;
        for (const column in qry) {
            columnValue = qry[column];

            switch (this.getType(columnValue)) {
                case DATA_TYPE.String:
                    results = results.concat(this.getAllCombinationOfWord(columnValue));
                    qry[column] = {};
                    qry[column][QUERY_OPTION.In] = results;
                    break;
                case DATA_TYPE.Object:
                    for (const key in columnValue) {
                        keyValue = columnValue[key];
                        if (this.isString(keyValue)) {
                            switch (key) {
                                case QUERY_OPTION.In:
                                    results = results.concat(this.getAllCombinationOfWord(keyValue, true));
                                    break;
                                case QUERY_OPTION.Like:
                                    break;
                                default:
                                    results = results.concat(this.getAllCombinationOfWord(keyValue));
                            }
                        }
                    }
                    qry[column][QUERY_OPTION.In] = results;
                    break;
            }
        }
        return qry;
    }
}