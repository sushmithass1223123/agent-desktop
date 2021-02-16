import { set } from 'lodash';

type Generic = string | number;

export const formatJsonData = (data: Record<Generic, any>, formatConfig: Record<Generic, Generic | Generic[]>) => {
    return Object.keys(formatConfig).reduce((acc, cur) => {
        if (typeof formatConfig[cur] === 'string') {
            set(acc, cur, data[formatConfig[cur] as string]);
        } else if (Array.isArray(formatConfig[cur])) {
            const value = (formatConfig[cur] as Generic[]).reduce((subAcc, subCur) => {
                if (!Object.keys(subAcc).length) {
                    subAcc = data[subCur];
                } else {
                    subAcc = subAcc[subCur];
                }
                return subAcc;
            }, {});
            set(acc, cur, value);
        }
        return acc;
    }, {});
};
