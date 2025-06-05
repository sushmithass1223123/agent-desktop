import { AgentSkillConfig } from './../components/agent-skill-list.interface';
import { InteractionWidget } from '..';

/**
 * Smp controls widget is used to handle social media posts. Some of the functionalites are:
 * - Reply, react to comments
 * - close posts, cancel changes.
 * - The config example:
 * ```json
 * {
 *     "Name": "Social Media Posts",
 *     "Description": "",
 *     "Type": "tw-smp-controls",
 *     "Config": {
 *         "Enabled": true,
 *         "Hidden": false,
 *         "Static": false,
 *         "Anchor": true,
 *         "AOT": false,
 *         "AutoOpen": false,
 *         "Icon": "video_label",
 *         "Class": "",
 *         "Position": { "X": 2, "Y": 1 },
 *         "Actions": ["maximize", "collapse", "float"],
 *         "ViewState": "restore",
 *         "Header": true,
 *         "Pinned": false
 *     },
 *     "Data": {
 *     }
 * }
 * ```
 */
export interface TwSmpControls<T> extends InteractionWidget<TwSmpControlsData, T> {}

/**
 * Data config for tw-email-controls widget
 */
export interface TwSmpControlsData {
    /**
     * To disable general social media notifications
    */
    disableSocialMediaNotifications: boolean;
    /**
     * Transfer config
    */
    Transfer: AgentSkillConfig;
    /**
     * Number in bytes to specify maximum file upload size
     */
    MaxFileUploadSize: number;
    /**
     * Send reply timeout
     */
    AsyncReplySendTimeout: number;

    /**
     * Path to redirect on interaction close
     */
    RedirectPath: string;
}