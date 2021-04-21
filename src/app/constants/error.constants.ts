import { WrcCodes } from '@tmac/sdk';
export const AV_ERRORS: Partial<Record<WrcCodes, string>> = {
    '-2': 'Media Failed',
    '-3': 'Request Timed Out',
    '-4': 'Screenshare Permission Denied'
};
