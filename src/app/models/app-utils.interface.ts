import { ChartDataSets, ChartOptions } from 'chart.js';
import { Color, SingleOrMultiDataSet } from 'ng2-charts';

export interface TChartConfig {
    data?: SingleOrMultiDataSet[];
    datasets?: ChartDataSets[];
    labels?: string[] | number[];
    options: ChartOptions & { setFeedbackEmoji?: boolean };
    colors?: Color[];
    legend?: boolean;
    refresh?: () => void;
}
