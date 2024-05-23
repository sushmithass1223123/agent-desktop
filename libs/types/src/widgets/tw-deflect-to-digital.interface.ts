import { InteractionWidget } from '..';

/**
 * Deflect to digital widget is used to deflect from any interaction channel to digital
 * ```json
 * {
 *   "Name": "Deflect To Digital",
 *   "Description": "",
 *   "Key": "TWDeflectToDigital",
 *   "Type": "tw-deflect-to-digital",
 *   "Config": {
 *      "Enabled": true,
 *      "Hidden": false,
 *      "Static": false,
 *      "Anchor": false,
 *      "AOT": false,
 *      "AutoOpen": false,
 *      "Icon": "",
 *      "Class": "",
 *      "Position": { "X": 2, "Y": 1 },
 *      "Actions": ["maximize", "float"],
 *      "ViewState": "restore",
 *      "Header": true,
 *      "Pinned": false
 *    },
 *   "Data": {
 *      "EditAllowed": false,
 *      "Number": "IncomingCallEvent.PhoneNumber",
 *      "DeflectExpiry": 5,
 *      "DeflectIntent": "devtest",
 *      "DestChannel": "textchat",
 *      "DestSubChannel": "text",
 *      "DisconnectTimeout": 1,
 *      "FallbackSkillId": 42001,
 *      "NextStatusName": "ACW",
 *      "StatusLockTimeout": 1,
 *      "ReservedStatusCode": 2
 *       }
 *    }
 * ```
 */
export type TwDeflectToDigital = InteractionWidget<TwDeflectToDigitalData>;

/**
 * tw-deflect-digital widget's Data object
 */
export interface TwDeflectToDigitalData {
    /**
     * Number or Event Path to which the message should be sent.
     * - Number: Hardcoded phone number
     * - Event Path: The path from any event to fetch the phone number. Example: "CCLDataEvent.RegisteredPhone"
     */
    Number: string;
    /**
     * Expiry of the this deflect in seconds
     */
    DeflectExpiry: number;
    /**
     *DepartmentFilters
     */
     DepartmentFilters: any;
    /**
     * Intent of the deflect
     */
    DeflectIntent: string;
    /**
     * Destination channel of the deflect
     */
    DestChannel: string;
    /**
     * Destination subchannel of the deflect
     */
    DestSubChannel: string;
    /**
     * Disconnect timeout for the source interaction
     * Acceptable values:
     * - -1 : no disconnect
     * - 0: immediate
     * - n : N seconds after interaction connect
     */
    DisconnectTimeout: number;
    /**
     * The skill to fallback to if unable to deflect to the agent
     */
    FallbackSkillId: string;
    /**
     * The next status to be assigned after the status lock timeout.
     * The name should be taken from AGT_AUX_Codes Table's "Name" column.
     */
    NextStatusName: string;
    /**
     * Lock agent status until this timeout
     */
    StatusLockTimeout: number;
    /**
     * The status code which will be assigned to the agent.
     * The value should be taken from AGT_AUX_Codes Table's "Value" column.
     */
    ReservedStatusCode: string;

    /**
     * To enable/disable content editing for text template 
     */
     EditAllowed: boolean;
}
