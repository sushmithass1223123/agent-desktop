import { Widget } from '..';

/**
 * [need more information]
 * tw-agent-assist widget
 * ```json
 * {
 *    "Name": "Agent Assist",
 *    "Description": "",
 *    "Key": "AgentAssist",
 *    "Type": "tw-agent-assist",
 *    "Config": {
 *        "Enabled": true,
 *        "Hidden": false,
 *        "Static": false,
 *        "Anchor": false,
 *        "AOT": false,
 *        "AutoOpen": false,
 *        "Icon": "verified_user",
 *        "Class": "",
 *        "Position": { "X": 2, "Y": 1 },
 *        "Actions": ["float"],
 *        "ViewState": "restore",
 *        "Header": true,
 *        "Pinned": false
 *    },
 *    "Data": {
 *        "Confidence": 0.5,
 *        "AssistWidgetUrl": "https://dice.tetherfi.cloud:8443/visual-ivr-websocket/?intent=${intent}&ucid=${Interaction.UCID}",
 *        "Title": "Agent Assist",
 *        "Icon": "assistant",
 *        "Width": 450,
 *        "Height": 800,
 *        "Actions": ["collapse", "maximize", "destroy"],
 *        "ViewState": "restore"
 *    }
 *}
 * ```
 */
export interface TwAgentAssist extends Widget<TwAgentAssistData> {}

export type TwAgentAssistData = {
    Confidence: number;
    AssistWidgetUrl: string;
    Title: string;
    Icon: string;
    Width: number;
    Height: number;
    Actions: string[];
    ViewState: string;
};
