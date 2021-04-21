import { set } from 'lodash';

type Generic = string | number;

/**
 * Return json in a format specfied in formatConfig
 * @param {Record<Generic, any>} data
 * @param {Record<Generic, Generic | Generic[]>} formatConfig
 * @returns {Record<Generic, Generic | Generic[]>}
 */
export const formatJsonData = <T = Record<Generic, Generic | Generic[]>>(data: Record<Generic, any>, formatConfig: T): T => {
    return Object.keys(formatConfig).reduce((acc, cur) => {
        if (typeof formatConfig[cur] === 'string') {
            set(acc, cur, data[formatConfig[cur] as string]);
        } else if (Array.isArray(formatConfig[cur])) {
            const value = (formatConfig[cur] as Generic[]).reduce((subAcc, subCur) => {
                if (!subAcc) {
                    subAcc = data[subCur];
                } else {
                    subAcc = subAcc ? subAcc[subCur] : null;
                }
                return subAcc;
            }, null);
            set(acc, cur, value);
        }
        return acc;
    }, {}) as any;
};
