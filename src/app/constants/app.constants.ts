import { Color } from 'ng2-charts';
import { SDKClient, TUtils } from 'tmac-sdk';

export const CHART_COLORS: Color[] = [
    {
        backgroundColor: 'rgb(138, 124, 207)',
        hoverBackgroundColor: 'rgba(196, 189, 231, 0.6)'
    },
    {
        backgroundColor: 'rgb(161, 120, 159)',
        hoverBackgroundColor: 'rgba(189, 160, 188, 0.6)'
    },
    {
        backgroundColor: 'rgb(194, 87, 143)',
        hoverBackgroundColor: 'rgba(231, 189, 211, 0.6)'
    },

    {
        backgroundColor: 'rgb(171, 162, 221)',
        hoverBackgroundColor: 'rgba(206, 157, 226, 0.2)'
    },
    {
        backgroundColor: 'rgb(182, 150, 181)',
        hoverBackgroundColor: 'rgba(226, 196, 237, 0.2)'
    },
    {
        backgroundColor: 'rgb(194, 87, 143)',
        hoverBackgroundColor: 'rgba(245, 235, 249, 0.2)'
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
