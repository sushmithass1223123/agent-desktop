import { AgentTransferConferenceConfig } from '../components/agent-skill-list.interface';
import { Widget } from '..';

/**
 * Create interaction widget is used to create different types of interactions like voice and email.
 * The config example json:
 * ```json
 * {
 *   "Name": "Create Interaction",
 *   "Description": "",
 *   "Type": "tw-create-interaction",
 *   "Config": { "Enabled": true },
 *   "Data": {
 *   "Channels": [
 *       {
 *          "Name": "Send SMS",
 *          "Enabled": true,
 *          "EnableState": "",
 *          "Type": "text",
 *          "SubType": "sms",
 *          "Icon": "sms",
 *          "Data": {}
 *       },
 *       {
 *           "Name": "Make Call",
 *           "Enabled": true,
 *           "EnableState": "calloutbound",
 *           "Type": "voice",
 *           "SubType": "voice",
 *           "Icon": "call",
 *           "Data": {
 *               "Agent": {
 *                       "Source": { "Use": "station", "Display": "${LastName}, ${FirstName}", "FreeTextAllowed": true },
 *                       "AllowedStates": [],
 *                       "TeamFilter": false,
 *                       "Columns": []
 *                    },
 *                   "SpeedDial": {
 *                           "Allowed": true,
 *                           "Consult": true,
 *                           "Blind": true,
 *                           "Comments": false,
 *                           "Source": { "Use": "Number", "Display": "${Name} - ${Number}", "FreeTextAllowed": true },
 *                           "Columns": [],
 *                           "TeamFilter": true
 *                        }
 *            }
 *       },
 *       {
 *          "Name": "Send WhatsApp",
 *          "Enabled": true,
 *          "EnableState": "",
 *          "Type": "text",
 *          "SubType": "whatsapp",
 *          "Icon": "custom-whatsapp",
 *          "Data": {}
 *       },
 *       {
 *          "Name": "Send Email",
 *          "Enabled": true,
 *          "EnableState": "",
 *          "Type": "email",
 *          "SubType": "email",
 *          "Icon": "email",
 *          "Data": {}
 *       }
 *    ]
 * }
 * ```
 */
export interface TwCreateInteraction extends Widget<TwCreateInteractionData> {}
export type TwCreateInteractionData = {
    /**
     * List of channels available for creating interactions
     */
    Channels: TwCreateInteractionChannel[];
};

export type TwCreateInteractionChannel = {
    /**
     * Channel name
     */
    Name: string;
    /**
     * Flag to enable channel
     */
    Enabled: boolean;
    /**
     * Channel enable state
     */
    EnableState: string;
    /**
     * Type of channel
     */
    Type: string;
    /**
     * Subtype of channel
     */
    SubType: string;
    /**
     * Icon for the channel
     */
    Icon: string;
    /**
     * Data for the channel
     */
    Data: AgentTransferConferenceConfig;
};
