import { AOTWidget } from '..';

/**
 * Compose messaging widget is used to compose and send SMS or Whatsapp message.
 * Example Config:
 * ```json
 * {
 *    "Name": "Compose Messaging",
 *    "Description": "",
 *    "Key": "Messaging",
 *    "Type": "tw-compose-messaging",
 *    "Config": {
 *        "Enabled": true,
 *        "Hidden": false,
 *        "Static": false,
 *        "Anchor": true,
 *        "AOT": false,
 *        "AutoOpen": false,
 *        "Icon": "sms",
 *        "Class": "",
 *        "Position": { "X": 2, "Y": 2 },
 *        "Actions": ["destroy"],
 *        "ViewState": "restore",
 *        "Header": true,
 *        "Pinned": false
 *    },
 *    "Data": { "Type": "sms", "Number": "CCLDataEvent.RegisteredPhone" }
 * }
 * ```
 */
export interface TwComposeMessaging extends AOTWidget<TwComposeMessagingData> {}

/**
 * Data config of compose messaging widget
 */
export type TwComposeMessagingData = {
    /**
     * Channel for the message
     */
    Type: 'sms' | 'whatsapp';
    /**
     * Number or Event Path to which the message should be sent.
     * - Number: Hardcoded phone number
     * - Event Path: The path from any event to fetch the phone number. Example: "CCLDataEvent.RegisteredPhone"
     */
    Number: string;
};
