import { ChartDataSets, ChartOptions } from 'chart.js';
import { Label } from 'ng2-charts';

export interface TChartConfig {
    data: ChartDataSets[];
    labels: Label;
    options: ChartOptions;
}
