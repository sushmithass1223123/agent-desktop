import { ChartDataSets, ChartOptions, ChartColor } from 'chart.js';
import { Label, Color } from 'ng2-charts';

export interface TwChartConfig {
    data: ChartDataSets[];
    labels?: Label | number[];
    options: ChartOptions & { setFeedbackEmoji?: boolean };
    colors?: Color[];
}
