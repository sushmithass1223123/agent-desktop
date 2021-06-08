// route reasons
export const OUTBOX_REASONS = ['CheckerQueue', 'CheckerPull'];
export const SENT_REASONS = ['AgentSentPull'];
export const DRAFT_REASONS = ['AgentDraftPull'];
export const INBOX_REASONS = ['MakerQueue', 'AgentPull', 'TransferToAgent', 'TransferToSkill'];

// entites
export const AVAILABLE_ENTITIES = [
    { key: 'PERSON', label: 'Names' },
    { key: 'ORG', label: 'Organizations' },
    { key: 'GPE', label: 'Locations' },
    { key: 'DATE', label: 'Dates' }
];

export const EMAIL_REASONCODE_VALUES = {
    0: 'success',
    1: 'Email Scheduled',
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
    30: 'Provided email account not found'
};

export const EMAIL_CURRENTSTATUS_CODES = {
    SentToCustomer: 'to customer',
    SentToCheckerSession: 'to checker'
};
