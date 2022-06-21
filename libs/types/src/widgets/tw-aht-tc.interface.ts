import { Widget } from '..';

/**
 * AHT-TC widget shows a table for the list of average handle time, and transfer / conference stats
 * {
 *    "Name": "AHT/Transfer/Conference",
 *    "Description": "",
 *    "Key": "AHT-Trans-Conf-Count",
 *    "Type": "tw-aht-tc",
 *    "Config": {
 *        "Enabled": true,
 *        "Hidden": false,
 *        "Static": false,
 *        "Anchor": false,
 *        "AOT": false,
 *        "AutoOpen": false,
 *        "Icon": "",
 *        "Class": "",
 *        "Position": { "X": 2, "Y": 1 },
 *        "Actions": ["maximize", "float"],
 *        "ViewState": "restore",
 *        "Header": true,
 *        "Pinned": false
 *    },
 *    "Data": { "Type": "grid", "Role": "agent" }
 * }
 */
export interface TwAhtTc extends Widget<TwAhtTcData> {}

/**
 * Data config of the AHT-TC widget
 */
export type TwAhtTcData = {
    /**
     * Type of display of the data
     */
    Type: 'chart' | 'grid';
    /**
     * Whether the widget is loaded in supervisor page or the agent's dashboard page
     */
    Role: 'supervisor' | 'agent';
    /**
     * Number of records to be fetched
     * @default 5
     */
    Limit: number;
    /**
     * Flag to show labels for the charts displayed
     */
    Label: boolean;
};
