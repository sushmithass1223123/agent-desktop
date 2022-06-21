import { Widget } from '..';

/**
 * Instant messaging widget.
 * This widget is used to send IMs to agents internally.
 * ```json
 * {
 *      "Name": "Agent IM",
 *      "Description": "",
 *      "Type": "tw-instant-messaging",
 *      "Config": { "Enabled": true },
 *      "Data": { "TeamFilter": true, "AudioEscalateAllowed": true, "VideoEscalateAllowed": true, "ScreenShareAllowed": true }
 * }
 * ```
 */
export interface TwInstantMessaging extends Widget<TwInstantMessagingData> {}

/**
 * Instant Messaging widget's data config
 */
export type TwInstantMessagingData = {
    /**
     * Flag to restricting sending of IMs only within the team
     */
    TeamFilter: boolean;
    /**
     * Flag to enable Audio escalation
     */
    AudioEscalateAllowed: boolean;
    /**
     * Flag to enable Video escalation
     */
    VideoEscalateAllowed: boolean;
    /**
     * Flag to enable screenshare
     */
    ScreenShareAllowed: boolean;
};
