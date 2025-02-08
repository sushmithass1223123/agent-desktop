import * as smpErrorCodes from '../../assets/constants/codes/smp.errorcodes.json';

// route reasons
export const SMP_OUTBOX_REASONS = ['CheckerQueue', 'CheckerPull'];
export const SMP_SENT_REASONS = ['AgentSentPull'];
export const SMP_DRAFT_REASONS = ['AgentDraftPull'];
export const SMP_INBOX_REASONS = ['MakerQueue', 'AgentPull', 'TransferToAgent', 'TransferToSkill'];
export const SMP_MAIL_REASONS = ['CheckerQueue', 'CheckerPull'];

export const SMP_REASONCODE_VALUES = {
    0: 'success',
    1: 'success',
    20: 'Mailbox is not enabled',
    21: 'Mailbox sending out not enabled',
    22: 'Exception (refer to emm logs)',
    23: 'Exception in smtp send',
    24: 'Generic excepion in send',
    25: 'Exception in ews send',
    26: 'EWS send failed',
    27: 'EMM not started',
    28: 'No smm account found',
    29: 'Generic main exception',
    30: 'Provided smm account not found',
    100: 'success'
};

export const SMP_SEND_STATUS = smpErrorCodes;

export const SMP_CURRENTSTATUS_CODES = {
    SentToCustomer: 'sharedComponents.socialMediaPosts.replySendToCustomer',
    SentToCheckerSession: 'sharedComponents.socialMediaPosts.replySendToChecker',
    EmailSending: 'sharedComponents.socialMediaPosts.postIsBeingSent'
};
