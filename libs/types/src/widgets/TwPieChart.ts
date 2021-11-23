import { Widget } from '..';

/**
 * A pie chart widget that supports displaying of data in a pie chart or doughnut chart
 */
export interface TwPieChart extends Widget<TwPieChartData> {}

/**
 * Types of available charts for the pie chart widget
 */
export type ChartType = 'pie' | 'doughnut';

/**
 * Role types for the pie chart widget
 */
export type RoleType = 'agent' | 'supervisor';

/**
 * The .Data of the pie-chart widget
 */
export interface TwPieChartData {
    /**
     * The type of widget
     * @type {Boolean}
     * @required
     */
    Source: string;

    /**
     * Option to change the chart type
     * @type {ChartType}
     * @default 'pie'
     */
    ChartType: ChartType;
    /**
     * Option to load the widget as agent or supervisor
     * @type {RoleType}
     * @required
     */
    Role: RoleType;
    /**
     * Flag to enable the arrows and label
     * @type {boolean}
     * @default true
     */
    Label: boolean;
    /**
     * Limits the number of records shown in the chart when minimized aka restore mode
     * @type {number}
     * @default 10
     */
    Limit: number;
}
