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

export const SMP_SEND_STATUS = {
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
    '-11': 'EmailManagerLoading'
};

export const SMP_CURRENTSTATUS_CODES = {
    SentToCustomer: 'sharedComponents.email.emailSendToCustomer',
    SentToCheckerSession: 'sharedComponents.email.emailSendToChecker',
    EmailSending: 'sharedComponents.socialMediaPosts.postIsBeingSent'
};
