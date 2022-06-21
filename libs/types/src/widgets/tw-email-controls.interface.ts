import { InteractionWidget } from '..';
import { AgentSkillConfig } from '../components/agent-skill-list.interface';

/**
 * Email controls widget is used to compose, reply, preview email interactions. Some of the functionalites are:
 * - Reply, Reply All, Forward, Transfer emails
 * - close email, mark email as spam, add interaction comment, and download email
 * - The config example:
 * ```json
 * {
 *     "Name": "Email Controls",
 *     "Description": "",
 *     "Type": "tw-email-controls",
 *     "Config": {
 *         "Enabled": true,
 *         "Hidden": false,
 *         "Static": false,
 *         "Anchor": true,
 *         "AOT": false,
 *         "AutoOpen": false,
 *         "Icon": "chat",
 *         "Class": "",
 *         "Position": { "X": 2, "Y": 1 },
 *         "Actions": ["maximize", "collapse", "float"],
 *         "ViewState": "restore",
 *         "Header": true,
 *         "Pinned": false
 *     },
 *     "Data": {
 *         "Transfer": {
 *             "Allowed": true,
 *             "Agent": {
 *                 "Allowed": true,
 *                 "Consult": true,
 *                 "Blind": true,
 *                 "Comments": true,
 *                 "Source": { "Use": "agentId", "Display": "agentName", "FreeTextAllowed": false },
 *                 "AllowedStates": ["Available", "Ready"],
 *                 "TeamFilter": false,
 *                 "Columns": ["FirstName", "LastName", "AgentID", "CurrentAgentStatus"]
 *             },
 *             "Skill": {
 *                 "Allowed": true,
 *                 "Consult": true,
 *                 "Blind": true,
 *                 "Comments": true,
 *                 "Source": { "Use": "vdn", "Display": "skill", "FreeTextAllowed": true },
 *                 "ChannelPrefix": ["EM"],
 *                 "Columns": []
 *             }
 *         },
 *         "DownloadAllowed": true,
 *         "ForwardAllowed": true,
 *         "ReplyAllAllowed": true,
 *         "InteractionCommentAllowed": true,
 *         "DraftPollingInterval": 10000,
 *         "TemplatesByTeam": false,
 *         "InternetHeadersAllowed": true
 *     }
 * }
 * ```
 */
export interface TwEmailControls<T> extends InteractionWidget<TwEmailControlsData, T> {}

/**
 * Data config for tw-email-controls widget
 */
export interface TwEmailControlsData {
    /**
     * Transfer config
     */
    Transfer: AgentSkillConfig;
    /**
     * Flag to show / hide  the forward button in email interaction window
     * @type {boolean} true / false
     * @default false
     */
    ForwardAllowed: boolean;
    /**
     * Flag to show / hide the reply all button in email interaction window
     * @type {boolean} true / false
     * @default false
     */
    ReplyAllAllowed: boolean;
    /**
     * Flag to enable the user to allow to add comment to the current email interaction
     * @type {boolean} true / false
     * @default false
     */
    InteractionCommentAllowed: boolean;
    /**
     * Polling interval in milliseconds to save the draft while its being edited.
     * When the value is 0, draft is not saved at all.
     * @default 0 (in milliseconds)
     */
    DraftPollingInterval: number;
    /**
     * Flag to decide whether the email templates in the interaction should be fetch by team or not.
     * @default false
     */
    TemplatesByTeam: boolean;
    /**
     * Flag to show / hide the internet header button in email interaction window
     * @default false
     */
    InternetHeadersAllowed: boolean;
}
