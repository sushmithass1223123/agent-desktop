// route reasons
export const OUTBOX_REASONS = ['CheckerQueue', 'CheckerPull','MakerQueue'];
export const SENT_REASONS = ['AgentSentPull'];
export const DRAFT_REASONS = ['AgentDraftPull'];
export const INBOX_REASONS = ['MakerQueue', 'AgentPull', 'TransferToAgent', 'TransferToSkill'];
export const MAIL_REASONS = ['CheckerQueue', 'CheckerPull'];

// entites
export const AVAILABLE_ENTITIES = [
    { key: 'PERSON', label: 'Names' },
    { key: 'ORG', label: 'Organizations' },
    { key: 'GPE', label: 'Locations' },
    { key: 'DATE', label: 'Dates' }
];

export const EMAIL_REASONCODE_VALUES = {
    0: 'success',
    1: 'success', // was Email Scheduled. Changed due to server issue
    20: 'Mailbox is not enabled',
    21: 'Mailbox sending out not enabled',
    22: 'Exception (refer to emm logs)',
    23: 'Exception in smtp send',
    24: 'Generic excepion in send',
    25: 'Exception in ews send',
    26: 'EWS send failed',
    27: 'EMM not started',
    28: 'No email account found',
    29: 'Generic main exception',
    30: 'Provided email account not found',
    100: 'success'
};

export const EMAIL_SEND_STATUS = {
    '1': 'Success',
    '0': 'Success',
    '-1': 'Fail',
    '-2': 'Fail',
    '-3': 'FailedWithServerBusyException',
    '-4': 'ExchangeAuthenticationError',
    '-5': 'ExchangeServiceObjectNotCreated',
    '-6': 'ExchangeMessageNotCreated',
    '-8': 'MailboxInstanceCreationError',
    '-9': 'EwsApiAdaptorDown',
    '-10': 'PayloadTooLarge',
    '-11': 'EmailManagerLoading',
    '404': 'ServerNotReachable'
};

export const EMAIL_CURRENTSTATUS_CODES = {
    SentToCustomer: 'sharedComponents.email.emailSendToCustomer',
    SentToCheckerSession: 'sharedComponents.email.emailSendToChecker',
    SentToCheckerQueue: 'sharedComponents.email.emailSendToChecker',
    EmailSending: 'sharedComponents.email.emailIsBeingSent'
};
