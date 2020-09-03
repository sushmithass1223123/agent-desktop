import { ChartDataSets, ChartOptions } from 'chart.js';
import { Color, SingleOrMultiDataSet } from 'ng2-charts';

export interface TwChartConfig {
    data?: SingleOrMultiDataSet[];
    datasets?: ChartDataSets[];
    labels?: string[] | number[];
    options: ChartOptions & { setFeedbackEmoji?: boolean };
    colors?: Color[];
    legend?: boolean;
    refresh?: () => void;
}

export interface ChatTranscripts {
    who?: string;
    messageId?: string;
    message?: string;
    type?: string;
    time?: string;
    divider?: boolean;
    attachment?: {
        src: string;
        type: string;
        name: string;
    };
}
