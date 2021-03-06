import { DATA_TYPE } from "./enums";

export class Util {
    static isNull(value) {
        if (value == null) {
            return true;
        } else {
            switch (typeof value) {
                case 'string': return value.length === 0;
                case 'number': return isNaN(value);
            }
        }
        return false;
    }

    static isString(value) {
        return typeof value === DATA_TYPE.String;
    }

    static isObject(value) {
        return typeof value === DATA_TYPE.Object;
    }

    static getObjectFirstKey(value) {
        for (const key in value) {
            return key;
        }
        return null;
    }

    /**
     *  get data type of supplied value
     * 
     * @static
     * @param {any} value 
     * @returns 
     * @memberof Util
     */
    static getType(value) {
        if (value === null) {
            return DATA_TYPE.Null;
        }
        const type = typeof value;
        switch (type) {
            case 'object':
                if (Array.isArray(value)) {
                    return DATA_TYPE.Array;
                }
                else if (value.getDate && value.getTime) {
                    return DATA_TYPE.DateTime;
                }
            default:
                return type;
        }
    }

}