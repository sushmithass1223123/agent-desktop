import { AppAlertDialogTypes, AppConfirmDialogTypes, ReminderTaskDialogTypes } from 'app/interfaces';
import { Color } from 'ng2-charts';

/**
 * Chart colors
 */
export const CHART_COLORS: any[] = [
    {
        backgroundColor: '#67B7DC',
        hoverBackgroundColor: 'rgba(138, 124, 207, 0.6)'
    },
    {
        backgroundColor: '#6894DD',
        hoverBackgroundColor: 'rgba(161, 120, 159, 0.6)'
    },
    {
        backgroundColor: '#6671DB',
        hoverBackgroundColor: 'rgba(194, 87, 143, 0.6)'
    },
    {
        backgroundColor: '#8067DC',
        hoverBackgroundColor: 'rgba(171, 162, 221, 0.2)'
    },
    {
        backgroundColor: '#A267DB',
        hoverBackgroundColor: 'rgba(182, 150, 181, 0.2)'
    },
    {
        backgroundColor: '#C667DB',
        hoverBackgroundColor: 'rgba(207, 124, 168, 0.2)'
    },
    {
        backgroundColor: '#DC67CF',
        hoverBackgroundColor: 'rgba(207, 124, 168, 0.2)'
    },
    {
        backgroundColor: '#DC67AB',
        hoverBackgroundColor: 'rgba(207, 124, 168, 0.2)'
    },
    {
        backgroundColor: '#DD6789',
        hoverBackgroundColor: 'rgba(207, 124, 168, 0.2)'
    },
    {
        backgroundColor: '#DC6868',
        hoverBackgroundColor: 'rgba(207, 124, 168, 0.2)'
    },
    {
        backgroundColor: '#DC8C67',
        hoverBackgroundColor: 'rgba(207, 124, 168, 0.2)'
    },
    {
        backgroundColor: '#DAAF66',
        hoverBackgroundColor: 'rgba(207, 124, 168, 0.2)'
    }
];

/**
 * Customer sentiment graph datapoints span
 */
export const CUSTOMER_SENTIMENT_PLOT_RECORDS = 10;

/**
 * Avatar colors
 */
export const AVATAR_COLORS = [
    '#D32F2F', // Red-700
    '#303F9F', // Indigo-700
    '#00796B', // Teal-700
    '#388E3C' // Green-700
];

/**
 * Common error message
 */
export const COMMON_ERR_MESSAGE = 'Something went wrong';

/**
 * Gamification labels
 */
export const GAMIFICATION_METRIC_LABELS = {
    chat_interactions: 'Chat Interactions',
    chat_interactions_aht: 'Chat Interactions AHT'
};

/**
 * Active callback statuses
 */
export const ACTIVE_CALL_STATUSES = ['agentconnected', 'dacaccepted'];

/**
 * Failed callback statuses
 */
export const FAILED_CALL_STATUSES = ['dacnotificationfailed', 'deleted', 'queuetimeout'];

/**
 * Pending callback statuses
 */
export const PENDING_CALL_STATUSES = ['open', 'queueconnected'];

/**
 * Alert dialog constants
 */
export const AppAlertDialogConstants: Record<
    AppAlertDialogTypes,
    {
        /**
         * Alert heading
         */
        heading: string;
        /**
         * Alert icon
         */
        icon: string;
    }
> = {
    info: {
        heading: 'Info',
        icon: 'info'
    },
    success: {
        heading: 'Success',
        icon: 'check'
    },
    warning: {
        heading: 'Warning',
        icon: 'warning'
    },
    error: {
        heading: 'Error',
        icon: 'warning'
    }
};

/**
 * Reminder Task dialog constants
 */
export const RemiderTaskDialogConstants: Record<
    ReminderTaskDialogTypes,
    {
        /**
         * Title of dialog
         */
        title: string;
        /**
         * Dialog message
         */
        message: string;
        /**
         * Dialog type
         */
        type: ReminderTaskDialogTypes;
    }
> = {
    makecall: {
        title: 'Task Reminder',
        message: 'Do you want to make this call?',
        type: 'makecall'
    },
    meeting: {
        title: 'Task Reminder',
        message: 'Do you want to accept the scheduled meeting?',
        type: 'meeting'
    },
    changestate: {
        title: 'Task Reminder',
        message: 'Do you want to change you status?',
        type: 'changestate'
    },
    dacrequest: {
        title: 'DAC Request',
        message: 'Do you to accept this DAC request?',
        type: 'dacrequest'
    },
    tcmwqvoice: {
        title: 'DAC Request',
        message: 'Do you to accept this DAC request?',
        type: 'tcmwqvoice'
    },
    reminder: {
        title: 'Reminder',
        message: '',
        type: 'reminder'
    }
};

/**
 * App confirm dialog constants
 */
export const AppConfirmDialogConstants: Record<
    AppConfirmDialogTypes,
    {
        /**
         * Title of dialog
         */
        title: string;
        /**
         * Dialog message
         */
        message: string;
        /**
         * Dialog type
         */
        type: string;
    }
> = {
    takeoverSession: {
        title: 'Confirm Login',
        message: 'Another session detected. Do you want to take it over?',
        type: 'takeoverSession'
    },
    endInteraction: {
        title: 'Confirm End',
        message: 'Are you sure to end this interaction?',
        type: 'endInteraction'
    },
    closeInteraction: {
        title: 'Confirm Close',
        message: 'Are you sure to close this interaction?',
        type: 'closeInteraction'
    },
    logout: {
        title: 'Confirm Logout',
        message: 'Are you sure you want to logout?',
        type: 'logout'
    },
    generic: {
        title: 'Confirm',
        message: 'Are you sure?',
        type: 'generic'
    }
};

/**
 * Agent features
 */
export const AGENT_FEATURES = {
    AllowSupervisorToBargeIn: 'allowsupervisortobargein',
    AllowSupervisorToCapturePicture: 'allowsupervisortocapturepicture',
    AllowSupervisorToChangeStatus: 'allowsupervisortochangestatus',
    AllowSupervisorToChatConference: 'allowsupervisortochatconference',
    AllowSupervisorToChatSilentMonitor: 'allowsupervisortochatsilentmonitor',
    AllowSupervisorToChatWhisper: 'allowsupervisortochatwhisper',
    AllowSupervisorToFaxTransferAgent: 'allowsupervisortofaxtransferagent',
    AllowSupervisorToFaxTransferSelf: 'allowsupervisortofaxtransferself',
    AllowSupervisorToInteractionNotification: 'allowsupervisortointeractionnotification',
    AllowSupervisorToLogout: 'allowsupervisortologout',
    AllowSupervisorToSendNotification: 'allowsupervisortosendnotification',
    AllowSupervisorToSilentMonitor: 'allowsupervisortosilentmonitor',
    AllowSupervisorToViewEmailDetails: 'allowsupervisortoviewemaildetails',
    IsSetBroadcastEnabled: 'issetbroadcastenabled',
    IsCameraCaptureEnabled: 'iscameracaptureenabled',
    IsScreenCaptureEnabled: 'isscreencaptureenabled',
    IsLocationEnabled: 'islocationenabled',
    IsAudioEscalateEnabled: 'isaudioescalateenabled',
    IsVideoEscalateEnabled: 'isvideoescalateenabled',
    IsChatSignatureEnabled: 'ischatsignatureenabled',
    IsChatWhiteboardEnabled: 'ischatwhiteboardenabled',
    IsChatAttachmentsEnabled: 'ischatattachmentsenabled',
    IsChatEmojiEnabled: 'ischatemojienabled',
    IsReplyOnChatEnabled: 'isreplyonchatenabled',
    IsChatConferenceEnabled: 'ischatconferenceenabled',
    IsChatTransferEnabled: 'ischattransferenabled',
    IsChatTemplateEnabled: 'ischattemplateenabled',
    IsChatReplyEnabled: 'ischatreplyenabled',
    IsChatCommentEnabled: 'ischatcommentenabled',
    IsChatHoldEnabled: 'ischatholdenabled',
    IsVideoSnapshotEnabled: 'isvideosnapshotenabled',
    IsChatVoiceNoteEnabled: 'ischatvoicenoteenabled',
    IsChatScreenshareEnabled: 'ischatscreenshareenabled',
    IsFaxOutEnabled: 'isfaxoutenabled',
    IsSMSOutEnabled: 'issmsoutenabled',
    IsWhatsAppOutEnabled: 'iswhatsappoutenabled',
    IsEmailOutEnabled: 'isemailoutenabled',
    IsOneWayVideoEnabled: 'isonewayvideoenabled',
    IsChatMediaDownloadEnabled: 'ischatmediadownloadenabled'
};

/**
 * Agent features map
 */
export const AGENT_FEATURES_MAP = {
    AllowSupervisorToBargeIn: {
        Type: 'interaction',
        SubType: 'voice',
        Icon: 'call_merge',
        Label: 'Barge-In'
    },
    AllowSupervisorToCapturePicture: {
        Type: 'agent',
        SubType: '',
        Icon: 'fact_check',
        Label: 'View Activity'
    },
    AllowSupervisorToChangeStatus: {
        Type: 'agent',
        SubType: '',
        Icon: 'track_changes',
        Label: 'Change Status'
    },
    AllowSupervisorToChatConference: {
        Type: 'interaction',
        SubType: 'textchat',
        Icon: 'forum',
        Label: 'Conference'
    },
    AllowSupervisorToChatSilentMonitor: {
        Type: 'interaction',
        SubType: 'textchat',
        Icon: 'speaker_notes',
        Label: 'Silent Monitor'
    },
    AllowSupervisorToChatWhisper: {
        Type: 'interaction',
        SubType: 'textchat',
        Icon: 'quickreply',
        Label: 'Whisper'
    },
    AllowSupervisorToFaxTransferAgent: {
        Type: 'interaction',
        SubType: 'fax',
        Icon: 'forward',
        Label: 'Transfer Fax'
    },
    AllowSupervisorToFaxTransferSelf: {
        Type: 'interaction',
        SubType: 'fax',
        Icon: 'play_for_work',
        Label: 'Self Transfer'
    },
    AllowSupervisorToInteractionNotification: {
        Type: 'interaction',
        SubType: 'all',
        Icon: 'notification_important',
        Label: 'Interaction Notification'
    },
    AllowSupervisorToLogout: {
        Type: 'agent',
        SubType: '',
        Icon: 'power_settings_new',
        Label: 'Logout'
    },
    AllowSupervisorToSendNotification: {
        Type: 'agent',
        SubType: '',
        Icon: 'notifications',
        Label: 'Send Notification'
    },
    AllowSupervisorToSilentMonitor: {
        Type: 'interaction',
        SubType: 'voice',
        Icon: 'contactless',
        Label: 'Silent Monitor'
    },
    AllowSupervisorToViewEmailDetails: {
        Type: 'interaction',
        SubType: '',
        Icon: 'email',
        Label: 'View Details'
    }
};

export const AUX_STATUSES = {
    available: {
        type: 'available',
        code: 112
    },
    acw: {
        type: 'acw',
        code: 0
    },
    aux_10: {
        type: 'aux',
        code: 10
    },
    aux_4: {
        type: 'aux',
        code: 4
    }
};

/**
 * Invalid chars
 */
export const INVALID_CHARS = [
    9, 12, 13, 16, 17, 18, 19, 20, 21, 25, 27, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 47, 91, 92, 93, 95, 11, 113, 114, 115, 116, 117,
    118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 151,
    166, 167, 168, 169, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183
];

export const CUSTOM_DATE_FORMATS = {
    parse: {
        dateInput: 'DD/MM/YYYY'
    },
    display: {
        dateInput: 'DD/MM/YYYY',
        monthYearLabel: 'MMMM YYYY',
        dateA11yLabel: 'LL',
        monthYearA11yLabel: 'MMMM YYYY'
    }
};

export const EXCLUDED_TMAC_EVENT = [
    'WallboardRefreshEvent',
    'TeamWallboardRefreshEvent',
    'QuizEvent',
    'TeamAgentListEvent',
    'AgentInteractionDetailsEvent',
    'AgentChannelListEvent',
    'AgentStatusDetailsEvent',
    'SupervisorAgentListEvent',
    'TeamAgentListDataEvent',
    'TeamChannelListEvent',
    'TeamIntentListEvent',
    'TeamActiveStatusDetailsEvent',
    'TeamActiveChannelListEvent',
    'TeamAgentInteractionDetailsEvent',
    'TeamrWorkCodeDetailsEvent',
    'VoiceCannedResponseEvent'
];
