import { maskData } from '@tmac/operators';
import { IUIEvent, TUtils } from '@tmac/sdk';
import { CustomerInfo, IMaskData } from 'app/interfaces';
import { get, set } from 'lodash';
import { extractJsonVal } from '@tmac/operators';
import { eventNames } from 'process';
import { Duration } from 'date-fns';

type Generic = string | number;

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
 * To process customer details based on TMAC events
 *
 * @param {CustomerInfo[]} customerInfo
 * @param {IUIEvent} evt
 *
 * @returns {CustomerInfo[]}
 */
export const processCustomerDetails = (customerInfo: CustomerInfo[]): { exec: (evt: IUIEvent) => void } => {
    // check if customer info map is available in this event
    const relevantInfo: Record<string, CustomerInfo[]> = customerInfo.reduce((acc, curr) => {
        const evetName = curr.ValueSource.split('.')[0];
        if (acc[evetName]) {
            acc[evetName].push(curr);
        } else {
            acc[evetName] = [curr];
        }
        return acc;
    }, {});

    const exec = (evt: IUIEvent) => {
        relevantInfo[evt.EventName].forEach((item) => getValueFromEvent(item, evt));
    };

    return { exec };
};

/**
 * To fetch value from TMAC event based on json path
 *
 * @param item
 * @param evt
 * @returns
 */
export const getValueFromEvent = (item: CustomerInfo, evt: IUIEvent): string => {
    // get the value from path or default value
    let extractedValue = extractJsonVal({ [evt.EventName]: evt }, item.ValueSource);
    item.Value = maskDataLocal(extractedValue, item.MaskData);
    // return value
    return item.Value;
};

/**
 * To mask a value based on config
 *
 * @param {String} value
 * @param {IMaskData | boolean} config
 */
const maskDataLocal = (value: string, config: IMaskData | boolean): string => {
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

/**
 * To throw AD error
 *
 * @param msg
 */
export const throwADError = (msg: string, error: any) => {
    TUtils.Logger.error(msg ?? 'Error in AD', error);
    throw new ADError(error);
};

export const formatDuration = (duration: Duration) => {
    let formatted = '';
    if (duration.hours < 10) {
        formatted = `0${duration.hours}:`;
    } else {
        formatted = `${duration.hours}:`;
    }

    if (duration.minutes < 10) {
        formatted = `${formatted}0${duration.minutes}:`;
    } else {
        formatted = `${formatted}${duration.minutes}:`;
    }

    if (duration.seconds < 10) {
        formatted = `${formatted}0${duration.seconds}`;
    } else {
        formatted = `${formatted}${duration.seconds}`;
    }

    return formatted;
};
