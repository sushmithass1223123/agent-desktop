import { Widget } from '..';

/**
 * Performance widget is part of the the gamificatino widgets,
 * which gets the agent's progress from the gamification api
 * ```json
 * {
 *   "Name": "Agent Performace",
 *   "Description": "",
 *   "Key": "AgentPerformanceWidget",
 *   "Type": "tw-ad-performance",
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
 *   "Data": { "AgentProgressUrl": "http://10.133.146.11:5002" }
 *    }
 * ```
 */
export interface TwPerformance extends Widget<TwPerformanceData> {}

/**
 * Performance data widget
 */
export type TwPerformanceData = {
    /**
     * Gamification server's Agent progress URL
     */
    AgentProgressUrl: string;
};
