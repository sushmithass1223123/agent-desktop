/**
 * Types of tasks available
 */
export interface TwCalendarTaskOption {
    /**
     * Name of the available task
     */
    Name: string;
    /**
     * Type of the task
     */
    Value: 'changestate' | 'makecall' | 'meeting';
}

import { Widget } from '..';

/**
 * Calendar widget is used to set reminder and events for the agents. The config example:
 * ```json
 * {
 *       "Name": "Calendar",
 *       "Description": "",
 *       "Key": "Calendar",
 *       "Type": "tw-calendar",
 *       "Config": {
 *          "Enabled": true,
 *          "Hidden": false,
 *          "Static": false,
 *          "Anchor": false,
 *          "AOT": false,
 *          "AutoOpen": false,
 *          "Icon": "today",
 *          "Class": "",
 *          "Position": { "X": 2, "Y": 2 },
 *          "Actions": ["maximize", "float"],
 *          "ViewState": "restore",
 *          "Header": true,
 *          "Pinned": false
 *        },
 *       "Data": {
 *          "TaskOptions": [
 *              { "Name": "Change Status", "Value": "changestate" },
 *              { "Name": "Make Call", "Value": "makecall" },
 *              { "Name": "Meeting", "Value": "meeting" }
 *              ]
 *           }
 *        }
 * ```
 */
export interface TwCalendar extends Widget<TwCalendarData> {}

/**
 * Calendar widget's Data config
 */
export type TwCalendarData = {
    /**
     * List of tasks available to create
     */
    TaskOptions: TwCalendarTaskOption[];
};
