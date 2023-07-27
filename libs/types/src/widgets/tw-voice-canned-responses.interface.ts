import { InteractionWidget } from '../core';

/**
 * Voice canned responses widget is used to send preconfigured template responses during voice calls.
 * This is supported only for webphone calls.
 * Example config:
 * ```json
 * {
 *    "Name": "Voice Canned Responses",
 *    "Description": "",
 *    "Key": "VoiceCannedResponses",
 *    "Type": "tw-voice-canned-responses",
 *    "Config": {
 *        "Enabled": true,
 *        "Hidden": false,
 *        "Static": false,
 *        "Anchor": true,
 *        "AOT": true,
 *        "AutoOpen": false,
 *        "Icon": "audiotrack",
 *        "Class": "",
 *        "Position": { "X": 0, "Y": 1 },
 *        "Actions": ["collapse", "destroy"],
 *        "ViewState": "restore",
 *        "Header": true,
 *        "Pinned": false
 *    },
 *    "Data": {}
 *}
 * ```
 */
export type TwVoiceCannedResponses = InteractionWidget<TwVoiceCannedResponsesData>;

/**
 * Voice canned response widget's data config
 */
export interface TwVoiceCannedResponsesData {
    autoPlayAfterTime?: number;
    autoPlayLoopEnabled?: boolean;
    autoPlauLoopPlaytime?: number;
}
