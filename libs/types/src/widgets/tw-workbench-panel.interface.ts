import { AgentTransferConferenceConfig } from '../components/agent-skill-list.interface';

/**
 * Configs related to individual workbench tabs
 */
export type TwEmailWorkbenchConfig = {
    /**
     * Transfer related settings of the workbench tab
     */
    Transfer?: AgentTransferConferenceConfig;
    /**
     * Polling interval of the tab.
     * This property allows the workbench tab to poll
     * relevant items with specific intervals.
     * Polling is disabled when this interval is 0.
     * @default 0 ie disabled
     * @type {number} (in milliseconds)
     */
    SearchPollingInterval: number;
    /**
     * Flag to enable the transfer of the item from workbench queue.
     * This is only available when the user is agent.
     * For supervisors this is always enabled.
     * @type {boolean} true | false
     * @default false
     */
    QueueTransferForAgent?: boolean;
};

export type TwChatWorkbenchConfig = {
    /**
     * Polling interval of the tab.
     * This property allows the workbench tab to poll
     * relevant items with specific intervals.
     * Polling is disabled when this interval is 0.
     * @default 0 ie disabled
     * @type {number} in milliseconds
     */
    SearchPollingInterval: number;
    /**
     * Flag to check whether to ask user before he pulls an item from the workbench
     * @type {boolean} true | false
     * @default false
     */
    AskPullConfirmation?: boolean;
    /**
     * Flag to check if the user is allowed to push an item from workbench queue
     */
    PushAllowed?: boolean;
};

/**
 * The Workbench panel's channel's individual config settings
 */
export type TwWorkbenchPanelChannel = {
    /**
     * Type of the workbench tab
     */
    Type: string;
    /**
     * Flag to check of the tab is enabled or not
     * @type {boolean} true | false
     */
    Enabled: boolean;
    /**
     * Icon of the tab in the workbench
     * @type {string} any material icons or custom icons provided by AD
     */
    Icon: string;
    /**
     * Config related to the workbbench Tab
     */
    Config: TwEmailWorkbenchConfig | TwChatWorkbenchConfig;
};

/**
 * General settings of the Workbench panel
 */
export type TwWorkbenchPanelGeneral = {
    /**
     * The workbench server's endpoint URL
     */
    WorkbenchUrl: string;
};

import { Widget } from '..';

/**
 * This widget is used to display the workbench panel containg the email and the chat worbench
 * - Email workbench shows the queued, inbox, sent, and draft emails
 * - Config example:
 * {
 *    "Name": "Workbench Panel",
 *    "Description": "",
 *    "Type": "tw-workbench-panel",
 *    "Config": {
 *        "Enabled": true,
 *        "Hidden": false,
 *        "Static": true,
 *        "Anchor": true,
 *        "AOT": false,
 *        "AutoOpen": false,
 *        "Icon": "dvr",
 *        "Class": "",
 *        "Position": { "X": 2, "Y": 3 },
 *        "Actions": [],
 *        "ViewState": "restore",
 *        "Header": false,
 *        "Pinned": false
 *    },
 *    "Data": {
 *        "General": { "WorkbenchUrl": "https://dice.tetherfi.cloud:55005/api/workbench" },
 *        "Channels": [
 *            {
 *                "Type": "Email",
 *                "Enabled": true,
 *                "Icon": "email",
 *                "Config": {
 *                    "Transfer": {
 *                        "Allowed": true,
 *                        "Agent": {
 *                            "Allowed": true,
 *                            "Consult": true,
 *                            "Blind": false,
 *                            "Comments": false,
 *                            "Source": { "Use": "agentId", "Display": "agentName", "FreeTextAllowed": false },
 *                            "AllowedStates": [],
 *                            "TeamFilter": false,
 *                            "Columns": []
 *                        },
 *                        "Skill": {
 *                            "Allowed": true,
 *                            "Consult": true,
 *                            "Blind": false,
 *                            "Comments": false,
 *                            "Source": { "Use": "vdn", "Display": "skill", "FreeTextAllowed": false },
 *                            "ChannelPrefix": ["EM"],
 *                            "Columns": []
 *                        }
 *                    },
 *                    "SearchPollingInterval": 0,
 *                    "DeleteAllowed": false,
 *                    "QueueTransferForAgent": false,
 *                    "TemplatesByTeam": false,
 *                    "Tabs": ["queue", "inbox", "sent", "drafts"],
 *                    "SearchDuration": 24
 *                }
 *            },
 *            {
 *                "Type": "Chat",
 *                "Enabled": true,
 *                "Icon": "chat",
 *                "Config": {
 *                    "PullAllowed": true,
 *                    "AskPullConfirmation": true,
 *                    "PushAllowed": true,
 *                    "SearchPollingInterval": 5000
 *                }
 *            }
 *        ]
 *    }
 *}
 */
export interface TwWorkbenchPanel extends Widget<TwWorkbenchPanelData> {}

/**
 * Data passed to tw-workbench-panel widget
 */
export type TwWorkbenchPanelData = {
    /**
     * Contains the general settings across the workbench
     */
    General: TwWorkbenchPanelGeneral;
    /**
     * Contains a list of tabs available in the workbench with their settings
     */
    Channels: TwWorkbenchPanelChannel[];
};
