import { Widget } from '..';

export type TwPieChart = Widget<TwPieChartData>;

export interface TwPieChartData {
    Source: string;
    ChartType: string;
    Role: string;
    Limit: number;
}
