import { Color } from 'ng2-charts';
import { SDKClient, TUtils } from 'tmac-sdk';
import { AppAlertDialogTypes, AppConfirmDialogTypes, ReminderTaskDialogTypes } from 'app/interfaces';

export const CHART_COLORS: Color[] = [
    {
        backgroundColor: 'rgb(138, 124, 207)',
        hoverBackgroundColor: 'rgba(138, 124, 207, 0.6)'
    },
    {
        backgroundColor: 'rgb(161, 120, 159)',
        hoverBackgroundColor: 'rgba(161, 120, 159, 0.6)'
    },
    {
        backgroundColor: 'rgb(194, 87, 143)',
        hoverBackgroundColor: 'rgba(194, 87, 143, 0.6)'
    },

    {
        backgroundColor: 'rgb(171, 162, 221)',
        hoverBackgroundColor: 'rgba(171, 162, 221, 0.2)'
    },
    {
        backgroundColor: 'rgb(182, 150, 181)',
        hoverBackgroundColor: 'rgba(182, 150, 181, 0.2)'
    },
    {
        backgroundColor: 'rgb(207, 124, 168)',
        hoverBackgroundColor: 'rgba(207, 124, 168, 0.2)'
    }
];

export const CUSTOMER_SENTIMENT_PLOT_RECORDS = 10;

export const AVATAR_COLORS = [
    '#D32F2F', // Red-700
    '#303F9F', // Indigo-700
    '#00796B', // Teal-700
    '#388E3C' // Green-700
];

export const COMMON_ERR_MESSAGE = 'Something went wrong';

export const GAMIFICATION_METRIC_LABELS = {
    chat_interactions: 'Chat Interactions',
    chat_interactions_aht: 'Chat Interactions AHT'
};

export const ACTIVE_CALL_STATUSES = ['AgentConnected', 'DacAccepted'];
export const FAILED_CALL_STATUSES = ['DacNotificationFailed'];
export const PENDING_CALL_STATUSES = ['Open', 'QueueConnected'];

export const AGENT_DATA_MAP = () => {
    try {
        // get the agent data
        const agentData = SDKClient.getAgentData();
        // get the keys
        const keys = Object.keys(agentData);
        // create a map object
        const mapObj = new Object();
        // loop through keys and create the map
        keys.forEach((item) => {
            mapObj[`_${item}`] = agentData[item];
        });
        // return the map
        return mapObj;
    } catch (error) {
        TUtils.Logger.log('Exception in AGENT_DATA_MAP', error);
    }
    return new Object();
};

export const AppAlertDialogConstants: Record<AppAlertDialogTypes, { heading: string; icon: string }> = {
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

export const RemiderTaskDialogConstants: Record<ReminderTaskDialogTypes, { title: string, message: string, type: string }> = {
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
    }
};

export const AppConfirmDialogConstants: Record<AppConfirmDialogTypes, { title: string, message: string, type: string }> = {
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
    'logout': {
        title: 'Confirm Logout',
        message: 'Are you sure you want to logout?',
        type: 'logout'
    },
    'generic': {
        title: 'Confirm',
        message: 'Are you sure?',
        type: 'generic'
    }
};

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
