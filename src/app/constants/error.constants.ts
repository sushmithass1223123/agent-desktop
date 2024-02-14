import { WrcCodes } from '@tmac/sdk';
export const AV_ERRORS: Partial<Record<WrcCodes, string>> = {
    '-2': 'Media Failed',
    '-3': 'Request Timed Out',
    '-4': 'Response Timed Out',
    '-5': 'Screenshare Cancelled',
    '104': 'Media not readable'
};

export const PERMISSION_ERRORS = {
    SCREENSHARE: -5
};
