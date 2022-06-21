import { InteractionWidget } from '..';

/**
 * Customer sentiment widget is used to map the customer's sentiment/mood data on a chart
 *```json
 *  {
 *      "Name": "Realtime Customer Sentiment",
 *      "Description": "feedback",
 *      "Key": "CustomerSentiment",
 *      "Type": "tw-customer-sentiment",
 *      "Config": {
 *          "Enabled": true,
 *          "Hidden": false,
 *          "Static": false,
 *          "Anchor": false,
 *          "AOT": false,
 *          "AutoOpen": false,
 *          "Icon": "sentiment_satisfied_alt",
 *          "Class": "",
 *          "Position": { "X": 2, "Y": 1 },
 *          "Actions": ["maximize", "float"],
 *          "ViewState": "restore",
 *          "Header": true,
 *          "Pinned": false
 *       },
 *      "Data": {}
 *  }
 * ```
 *
 */
export interface TwCustomerSentiment extends InteractionWidget<TwCustomerSentimentData> {}

/**
 * Customer sentiment widget's data config
 */
export type TwCustomerSentimentData = {};
