import { InteractionWidget } from '..';

/**
 * Customer journey widget is used to display the past interactions of the customer.
 * Example config:
 * ```json
 * {
 *   "Name": "Customer Journey",
 *   "Description": "",
 *   "Type": "tw-customer-journey",
 *   "Config": {
 *      "Enabled": true,
 *      "Hidden": false,
 *      "Static": false,
 *      "Anchor": true,
 *      "AOT": false,
 *      "AutoOpen": false,
 *      "Icon": "storage",
 *      "Class": "",
 *      "Position": { "X": 2, "Y": 1 },
 *      "Actions": ["maximize", "collapse"],
 *      "ViewState": "collapse",
 *      "Header": true,
 *      "Pinned": false
 *    },
 *   "Data": {
 *          "IframeBaseUrl": "https://dice.tetherfi.cloud/CustomerJourneyUI/AgentCustomerJourney/Version1/index.html?Key=SESSIONID:",
 *          "NoOfRecords": 10,
 *          "SentimentDashboardUrl": "https://dice.tetherfi.cloud/SentimentDashboard",
 *          "Columns": [
 *              "InteractionDate",
 *              "Channel",
 *              "Direction",
 *              "InteractionText",
 *              "Intent",
 *              "LastServicedAgentName",
 *              "CIF",
 *              "NRIC",
 *              "Actions"
 *           ]
 *       }
 *    }
 * ```
 */
export type TwCustomerJourney = InteractionWidget<TwCustomerJourneyData>;

/**
 * tw-customer-journey widget's config data
 */
export interface TwCustomerJourneyData {
    /**
     * The session history's iframe base url
     */
    IframeBaseUrl: string;
    /**
     * number of records to be loaded per page of the customer joueney table
     */
    NoOfRecords: number;
    /**
     * Sentiment dashboard webapp's base url
     */
    SentimentDashboardUrl: string;
    /**
     * Columns to be dispayed in the customer jorney table.
     * @type {AvailableColumn[]}  list of AvailableColumns
     */
    Columns: AvailableColumn[];
}

/**
 * List of available columsn for customer journey
 */
export type AvailableColumn =
    | 'Channel'
    | 'InteractionText'
    | 'InteractionDate'
    | 'Direction'
    | 'Intent'
    | 'AgentName'
    | 'LastServicedAgentName'
    | 'CIF'
    | 'NRIC'
    | 'PhoneNumber'
    | 'EmailID'
    | 'GroupID'
    | 'OverallSentiment'
    | 'Actions';
