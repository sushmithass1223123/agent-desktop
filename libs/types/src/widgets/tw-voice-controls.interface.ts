import { AgentSkillConfig } from '../components/agent-skill-list.interface';
import { InteractionWidget, InteractionWidgetBaseData } from '../core';

/**
 * IVR's menu and transfer config
 */
export type TwVoiceControlsIVR = {
    /**
     * Flag to show last 4 IVR menus for incoming calls as well as call flows for outgoing calls
     * @type {Boolean} true | false
     * @default false
     */
    MenuEnabled: boolean;
    /**
     * List of default IVR menus
     */
    DefaultMenu: string[];
    /**
     * IVR transfer config
     */
    Transfer: IVRTransfer;
};

/**
 * IVR transfer config
 */
export type IVRTransfer = {
    /**
     * Flag to enable IVR transfer button
     * @type {Boolean} true | false
     * @default false
     */
    Allowed: boolean;
    /**
     * List of IVR transfer menus
     */
    Menu: IVRTransferMenu[];
};

/**
 * Type of the menu option
 */
export type IVRMenuTypes = 'nv' | 'v_nv';

/**
 * IVR transfer menu config
 */
export type IVRTransferMenu = {
    /**
     * Label for the menu option
     */
    Text: string;
    /**
     * Type of the menu option.
     * If the customer is verified, then AD will remove all the non-verified (nv) options
     */
    Type: IVRMenuTypes;
    /**
     * Value of menu option to be used to pass to the backend
     */
    Value: string;
    /**
     * Icon of the menu option
     */
    Icon: string;
};

/**
 * Voice controls widget is used during voice interactions. Its main features are:
 * - Answer, Transfer, Conference calls
 * - Add interaction comments, send sms (templates available), redial
 * Example config:
 * ```json
 * {
 *     "Name": "Voice Call",
 *     "Description": "",
 *     "Type": "tw-voice-controls",
 *     "Config": {
 *         "Enabled": true,
 *         "Hidden": false,
 *         "Static": false,
 *         "Anchor": true,
 *         "AOT": false,
 *         "AutoOpen": false,
 *         "Icon": "phone",
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
 *                 "Source": {
 *                     "Use": "station",
 *                     "Display": "${LastName}, ${FirstName}",
 *                     "FreeTextAllowed": true
 *                 },
 *                 "AllowedStates": [],
 *                 "TeamFilter": false,
 *                 "Columns": []
 *             },
 *             "Skill": {
 *                 "Allowed": true,
 *                 "Consult": true,
 *                 "Blind": true,
 *                 "Comments": true,
 *                 "Source": { "Use": "vdn", "Display": "skill", "FreeTextAllowed": true },
 *                 "ChannelPrefix": ["VO"],
 *                 "Columns": []
 *             },
 *             "SpeedDial": {
 *                 "Allowed": true,
 *                 "Consult": true,
 *                 "Blind": true,
 *                 "Comments": false,
 *                 "Source": { "Use": "Number", "Display": "Number", "FreeTextAllowed": true },
 *                 "Columns": [],
 *                 "TeamFilter": false
 *             }
 *         },
 *         "Conference": {
 *             "Allowed": true,
 *             "Agent": {
 *                 "Allowed": true,
 *                 "Consult": true,
 *                 "Blind": true,
 *                 "Comments": true,
 *                 "Source": { "Use": "station", "Display": "agentName", "FreeTextAllowed": true },
 *                 "AllowedStates": [],
 *                 "TeamFilter": false,
 *                 "Columns": []
 *             },
 *             "Skill": {
 *                 "Allowed": true,
 *                 "Consult": true,
 *                 "Blind": true,
 *                 "Comments": true,
 *                 "Source": { "Use": "vdn", "Display": "skill", "FreeTextAllowed": true },
 *                 "ChannelPrefix": ["VO"],
 *                 "Columns": []
 *             }
 *         },
 *         "IVR": {
 *             "MenuEnabled": true,
 *             "DefaultMenu": ["Main Menu TRPS Way", "Products", "Mobile", "Agent"],
 *             "Transfer": {
 *                 "Allowed": true,
 *                 "Menu": [{ "Text": "Accesscode+TPIN", "Type": "v_nv", "Value": "tpin", "Icon": "lock" }]
 *             }
 *         },
 *         "DialpadAllowed": true,
 *         "InteractionCommentAllowed": true,
 *         "MakeCallAllowed": true,
 *         "SendSMSAllowed": true,
 *         "CloseInteractionOnEnd": false
 *     }
 * }
 * ```
 */
export interface TwVoiceControls<T> extends InteractionWidget<TwVoiceControlsData, T> {}

/**
 * The data config for voice controls widget
 */
export type TwVoiceControlsDataConfig = {
    /**
     * Transfer config
     */
    Transfer: AgentSkillConfig;
    /**
     * Conference config
     */
    Conference: AgentSkillConfig;
    /**
     * IVR menu and transfer config
     */
    IVR: TwVoiceControlsIVR;
    /**
     * Flag to enable dialpad button (webphone calls)
     * @type {boolean} true / false
     * @default false
     */
    DialpadAllowed: boolean;
    /**
     * Flag to enable the user to allow to add comment to the current voice interaction
     * @type {boolean} true / false
     * @default false
     */
    InteractionCommentAllowed: boolean;
    /**
     * Flag to enable redial button after the interaction is disconnected
     * @type {boolean} true / false
     * @default false
     */
    MakeCallAllowed: boolean;
    /**
     * Flag to enable sms button
     * @type {boolean} true / false
     * @default false
     */
    SendSMSAllowed: boolean;
    /**
     * Flag to close interaction on disconnect
     * @type {boolean} true / false
     * @default false
     */
    CloseInteractionOnEnd: boolean;

    /**
     * Flag to disable reset call feature
     * @type {boolean} true/false
     * @default false
     */
     disableResetCall: boolean;

     connectionTimeout: number;

     /**
      * Flag to disable confirmation on end call & close interaction
      * @type {ConfirmFeatureTypes}
      */
     DisableConfirmation: ConfirmFeatureTypes;

    /**
     * Flag to enable auto hold feature when answering a new call
     */
    AutoHoldActiveCallOnNewCallAnswer: boolean,
    /**
     * Flag to enable confirmation dialog before holding the call on answering / unholding 2nd call
     */
    ShowPromptForAutoHold: boolean,
    /**
     * Flag to enable auto hold feature when unholding a call
     */
    AutoHoldActiveCallOnUnhold: boolean,
    /**
     * Path to redirect on interaction close
     */
    RedirectPath: string
};

export type ConfirmFeatureTypes = {
    "OnEndCall": boolean;
    "OnCloseInteraction": boolean;
}

/**
 * Data config of voice interaction within component
 */
export type TwVoiceControlsData = InteractionWidgetBaseData & TwVoiceControlsDataConfig;
