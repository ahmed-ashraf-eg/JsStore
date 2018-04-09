import { NotWhere } from "./not_where";

export class In extends NotWhere {
    protected executeInLogic(column, values) {
        if (this.skipRecord && this.limitRecord) {
            this.executeSkipAndLimitForIn(column, values);
        }
        else if (this.skipRecord) {
            this.executeSkipForIn(column, values);
        }
        else if (this.limitRecord) {
            this.executeLimitForIn(column, values);
        }
        else {
            this.executeSimpleForIn(column, values);
        }
    }

    private executeSkipAndLimitForIn(column, values) {
        var cursor: IDBCursorWithValue,
            skip = this.skipRecord,
            column_store = this.objectStore.index(column),
            cursor_request: IDBRequest,
            skipOrPush = function (value) {
                if (skip === 0) {
                    this._results.push(value);
                }
                else {
                    --skip;
                }
            }.bind(this),
            onCursorError = function (e) {
                this._errorOccured = true;
                this.onErrorOccured(e);
            }.bind(this);
        if (this.checkFlag) {
            for (var i = 0, length = values.length; i < length; i++) {
                if (!this.errorOccured) {
                    cursor_request = column_store.openCursor(IDBKeyRange.only(values[i]));
                    cursor_request.onsuccess = function (e) {
                        cursor = e.target.result;
                        if (this._results.length !== this._limitRecord && cursor) {
                            if (this._whereChecker.check(cursor.value)) {
                                skipOrPush(cursor.value);
                            }
                            cursor.continue();
                        }
                        else if (i + 1 === length) {
                            this.onQueryFinished();
                        }
                    }.bind(this);
                    cursor_request.onerror = onCursorError;
                }
            }
        }
        else {
            for (var i = 0, length = values.length; i < length; i++) {
                if (!this.errorOccured) {
                    cursor_request = column_store.openCursor(IDBKeyRange.only(values[i]));
                    cursor_request.onsuccess = function (e) {
                        cursor = e.target.result;
                        if (this._results.length !== this._limitRecord && cursor) {
                            skipOrPush(cursor.value);
                            cursor.continue();
                        }
                        else if (i + 1 === length) {
                            this.onQueryFinished();
                        }
                    }.bind(this);
                    cursor_request.onerror = onCursorError;
                }
            }
        }
    }

    private executeSkipForIn(column, values) {
        var cursor: IDBCursorWithValue,
            skip = this.skipRecord,
            cursor_request: IDBRequest,
            column_store = this.objectStore.index(column),
            skipOrPush = function (value) {
                if (skip === 0) {
                    this._results.push(value);
                }
                else {
                    --skip;
                }
            }.bind(this),
            onCursorError = function (e) {
                this._errorOccured = true;
                this.onErrorOccured(e);
            }.bind(this);
        if (this.checkFlag) {
            for (var i = 0, length = values.length; i < length; i++) {
                if (!this.errorOccured) {
                    cursor_request = column_store.openCursor(IDBKeyRange.only(values[i]));
                    cursor_request.onsuccess = function (e) {
                        cursor = e.target.result;
                        if (cursor) {
                            if (this._whereChecker.check(cursor.value)) {
                                skipOrPush((cursor.value));
                            }
                            cursor.continue();
                        }
                        else if (i + 1 === length) {
                            this.onQueryFinished();
                        }
                    }.bind(this);
                    cursor_request.onerror = onCursorError;
                }
            }
        }
        else {
            for (var i = 0, length = values.length; i < length; i++) {
                if (!this.errorOccured) {
                    cursor_request = column_store.openCursor(IDBKeyRange.only(values[i]));
                    cursor_request.onsuccess = function (e) {
                        cursor = e.target.result;
                        if (cursor) {
                            skipOrPush((cursor.value));
                            cursor.continue();
                        }
                        else if (i + 1 === length) {
                            this.onQueryFinished();
                        }
                    }.bind(this);
                    cursor_request.onerror = onCursorError;
                }
            }
        }
    }

    private executeLimitForIn(column, values) {
        var cursor: IDBCursorWithValue,
            cursor_request: IDBRequest,
            column_store = this.objectStore.index(column),
            onCursorError = function (e) {
                this._errorOccured = true;
                this.onErrorOccured(e);
            }.bind(this);
        if (this.checkFlag) {
            for (var i = 0, length = values.length; i < length; i++) {
                if (!this.errorOccured) {
                    cursor_request = column_store.openCursor(IDBKeyRange.only(values[i]));
                    cursor_request.onsuccess = function (e) {
                        cursor = e.target.result;
                        if (cursor && this._results.length !== this._limitRecord) {
                            if (this._whereChecker.check(cursor.value)) {
                                this._results.push(cursor.value);
                            }
                            cursor.continue();
                        }
                        else if (i + 1 === length) {
                            this.onQueryFinished();
                        }
                    }.bind(this);
                    cursor_request.onerror = onCursorError;
                }
            }
        }
        else {
            for (var i = 0, length = values.length; i < length; i++) {
                if (!this.errorOccured) {
                    cursor_request = column_store.openCursor(IDBKeyRange.only(values[i]));
                    cursor_request.onsuccess = function (e) {
                        cursor = e.target.result;
                        if (cursor && this._results.length !== this._limitRecord) {
                            this._results.push(cursor.value);
                            cursor.continue();
                        }
                        else if (i + 1 === length) {
                            this.onQueryFinished();
                        }
                    }.bind(this);
                    cursor_request.onerror = onCursorError;
                }
            }
        }
    }

    private executeSimpleForIn(column, values) {
        var cursor: IDBCursorWithValue,
            cursor_request: IDBRequest,
            column_store = this.objectStore.index(column),
            onCursorError = function (e) {
                this._errorOccured = true;
                this.onErrorOccured(e);
            }.bind(this);
        if (this.checkFlag) {
            for (var i = 0, length = values.length; i < length; i++) {
                if (!this.errorOccured) {
                    cursor_request = column_store.openCursor(IDBKeyRange.only(values[i]));
                    cursor_request.onsuccess = function (e) {
                        cursor = e.target.result;
                        if (cursor) {
                            if (this._whereChecker.check(cursor.value)) {
                                this._results.push(cursor.value);
                            }
                            cursor.continue();
                        }
                        else if (i + 1 === length) {
                            this.onQueryFinished();
                        }
                    }.bind(this);
                    cursor_request.onerror = onCursorError;
                }
            }
        }
        else {
            for (var i = 0, length = values.length; i < length; i++) {
                if (!this.errorOccured) {
                    cursor_request = column_store.openCursor(IDBKeyRange.only(values[i]));
                    cursor_request.onsuccess = function (e) {
                        cursor = e.target.result;
                        if (cursor) {
                            this._results.push(cursor.value);
                            cursor.continue();
                        }
                        else if (i + 1 === length) {
                            this.onQueryFinished();
                        }
                    }.bind(this);
                    cursor_request.onerror = onCursorError;
                }
            }
        }
    }
}