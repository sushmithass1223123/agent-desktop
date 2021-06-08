import { maskData } from '@tmac/operators';
import { IMaskData } from 'app/interfaces';
import { get, join, set } from 'lodash';

type Generic = string | number;

/**
 * Return json in a format specfied in formatConfig
 * @param {Record<Generic, any>} data
 * @param {Record<Generic, Generic | Generic[]>} formatConfig
 * @returns {Record<Generic, Generic | Generic[]>}
 */
export const formatJsonData = <T = Record<Generic, any>>(data: Record<Generic, any>, formatConfig: Record<Generic, Generic | Generic[]>): T => {
    return Object.keys(formatConfig).reduce((acc, cur) => {
        if (typeof formatConfig[cur] === 'string') {
            set(acc, cur, get(data, formatConfig[cur] as string));
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

/**
 * To convert link to a tag
 *
 * @param {String} text
 */
export const urlify = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, (url: string) => {
        return '<a target="_blank" href="' + url + '">' + url + '</a>';
    });
};

export const maticonByExtension = (ext: string) => {
    let icon = '';
    switch (ext.toLowerCase()) {
        case 'txt':
            icon = 'custom-file-text';
            break;

        case 'pdf':
            icon = 'custom-file-pdf';
            break;

        case 'xls':
        case 'xlsx':
            icon = 'custom-file-excel';
            break;

        case 'ppt':
        case 'pptx':
            icon = 'custom-file-ppt';
            break;

        case 'zip':
        case 'war':
            icon = 'custom-file-zip';
            break;

        case 'png':
        case 'jpeg':
        case 'jpg':
            icon = 'custom-file-image';
            break;

        case 'doc':
        case 'docx':
            icon = 'custom-file-word';
            break;

        case 'mp4':
        case 'mpeg':
        case 'avi':
        case 'ogv':
        case 'webm':
            icon = 'custom-file-video';
            break;

        case 'aac':
        case 'mp3':
        case 'wav':
            icon = 'custom-file-audio';
            break;

        default:
            icon = 'custom-file-default';
    }
    return icon;
};

/**
 * To get property value from event
 *
 * @param {String[]} valueSourceSplit
 * @param {Any} json
 * @param {String} defaultValue
 */
export const getValueFromJson = (valueSourceSplit: string[], json: any, defaultValue: string) => {
    // remove the event name from the array
    valueSourceSplit.shift();
    // map the property and get the value from event property
    const valueMap = join(valueSourceSplit, '.');
    // get the value from path or default value
    return get(json, valueMap, defaultValue);
};

/**
 * To mask a value based on config
 *
 * @param {String} value
 * @param {IMaskData | boolean} config
 */
export const maskDataLocal = (value: string, config: IMaskData | boolean): string => {
    try {
        // check if value and config is defined
        if (value && config) {
            // mask with default if boolean
            if (typeof config === 'boolean' && config === true) {
                return maskData(value);
                // mask with config is object
            } else if (typeof config === 'object') {
                return maskData(value, {
                    maskWith: config.MaskWith,
                    maxMaskedChars: config.MaxMaskedChars,
                    unmaskedStartChars: config.UnMaskedStartChars,
                    unmaskedEndChars: config.UnMaskedEndChars
                });
            }
        }
    } catch (error) {}

    // return input for error/default scenario
    return value;
};

/**
 * ADError custom error class
 */
export class ADError extends Error {
    constructor(msg: string) {
        super(msg);
        this.name = ADError.name;
    }
}

export const throwADError = (msg: string) => {
    throw new ADError(msg);
};
