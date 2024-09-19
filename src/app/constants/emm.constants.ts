// route reasons
export const OUTBOX_REASONS = ['CheckerQueue', 'CheckerPull', 'MakerQueue'];
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
    // '-7': 'NullRequest',
    '-8': 'MailboxInstanceCreationError',
    '-9': 'EwsApiAdaptorDown',
    '-10': 'PayloadTooLarge',
    '-11': 'MediaInS3UrlNotAvailable',
    '-12': 'GenericExceptionAttachmentDownload',
    '-13': 'S3UrlNotFoundInDatabase',
    '-17': 'SendEmailTimeoutError',
    '-20': 'MailboxNotEnabled',
    '-21': 'SendEmailNotEnabledForMailbox',
    '-22': 'GenericExceptionOnSendEmail',
    '-23': 'ExceptionInSmtpEmailSend',
    '-27': 'EmailManagerNotStarted',
    '-28': 'EmailAccountNotFound',
    '-30': 'Provided_Email_Account_Not_Found',
    '-50': 'Attachment_Url_Null',
    '-51': 'Attachment_File_Type_Null',
    '-52': 'Attachment_Name_Null',
    '-53': 'ErrorOnWritingBase64ToLocalFile',
    '-54': 'FileTypeParseError',
    '-55': 'ExceptionOnRetrievingAttachmentInformation',
    '-100': 'AgentNotLoggedInToTMAC',
    '-407': 'NoCheckerSkillForAgent',
    '-404': 'EmailNotFoundInQueue',
    '-405': 'EmailAssignedToOtherAgent',
    '-301': 'FailedToPullFromMakerQueue',
    '-302': 'FailedToPullFromSentItems',
    '-303': 'DraftEmailHasBeenPulledByAgent',
    '-304': 'FailedToPullFromMakerDraft',
    '-305': 'EmailNotPresentInSourceAgent',
    '-306': 'FailedToTransferEmailToAgent',
    '-307': 'FailedToTransferEmailToSkill',
    '-308': 'FailedToComposeNewEmail',
    '-309': 'FailedToMaskInboxEmail',
    '-310': 'FailedToBulkCloseEmailInQueue',
    '-311': 'FailedToBulkCloseEmailInQueueWithReply',
    '-312': 'FailedToBulkCloseEmailInQueueWithTransfer',
    '-313': 'FailedToBulkDeleteDraftEmail',
    // '-314': 'FailedToMergeEmail',
    // '-315': 'FailedToCloneEmail',
    '-316': 'FailedToMarkEmailAsSpam',
    '-317': 'FailedToInsertEmailAddressToSpam',
    '-318': 'FailedToCloseEmailWhileMarkingAsSpam',
    '-319': 'FailedToDeleteEmailWhileMarkingAsSpam',
    '-320': 'FailedToTransferEmailToAgentInOutlookPlugin',
    '-321': 'FailedToTransferEmailToSkillInOutlookPlugin',
    '-322': 'FailedToPullEmailFromMakerQueueInOutlookPlugin',
    '-323': 'FailedToPullAndCloseemailFromMakerQueueInOutlookPlugin',
    '-324': 'FailedToDeleteEmail',
    '-325': 'FailedToScheduleEmail',
    '-326': 'EmailManagerLoading',
    '-327': 'SendEmailExceptionWhileUsingIWFlow',
    '-328': 'UploadAttachmentFailed',
    '-329': 'InlineAttachmentDownloadFailed',
    '-331': 'Success',
    '-332': 'FailedToSendEmail',
    '-333': 'EmailMaxTabCountReached',
    '-334': 'ExceptionOnFileDownloadFromS3',
    '-335': 'PullToFromMakerQueueSinceOutlookRoutingEnabled',
    '-336': 'CannotFindRemoteAgentState',
    '-337': 'EmailNotFoundInInbox',
    '-338': 'FailedToPullFromQueueWhenAgentIsInvalidState',
    '404': 'ServerNotReachable'
};

export const EMAIL_CURRENTSTATUS_CODES = {
    SentToCustomer: 'sharedComponents.email.emailSendToCustomer',
    SentToCheckerSession: 'sharedComponents.email.emailSendToChecker',
    SentToCheckerQueue: 'sharedComponents.email.emailSendToChecker',
    EmailSending: 'sharedComponents.email.emailIsBeingSent'
};
