import { ChartDataSets, ChartOptions } from 'chart.js';
import { Color, SingleOrMultiDataSet } from 'ng2-charts';

export interface TWChartPieceLabel {
    // render 'label', 'value', 'percentage', 'image' or custom function, default is 'percentage'
    render: 'value';

    // precision for percentage, default is 0
    precision: number;

    // identifies whether or not labels of value 0 are displayed, default is false
    showZero: boolean;

    // font size, default is defaultFontSize
    fontSize: number;

    // font color, can be color array for each data or function for dynamic color, default is defaultFontColor
    fontColor: string;

    // font style, default is defaultFontStyle
    fontStyle: 'normal' | 'bold' | 'italic';

    // font family, default is defaultFontFamily
    fontFamily: string;

    // draw label in arc, default is false
    arc: boolean;

    // position to draw label, available value is 'default', 'border' and 'outside'
    // default is 'default'
    position: 'default' | 'border' | 'outside';

    // draw label even it's overlap, default is false
    overlap: boolean;

    // show the real calculated percentages from the values and don't apply the additional logic to fit the percentages to 100 in total, default is false
    showActualPercentages: boolean;

    // set images when `render` is 'image'
    images: {
        src: string;
        width: number;
        height: number;
    }[];

    // available only when position = 'outside'
    // if value = true show a callout arrow to label
    segment: boolean;

    // available only when position = 'outside'
    // stroke color for segment (if value = 'auto' use series backgroundColor)
    segmentColor: string;
}

export interface TwChartConfig {
    data?: SingleOrMultiDataSet[];
    datasets?: ChartDataSets[];
    labels?: string[] | number[];
    options: ChartOptions & { setFeedbackEmoji?: boolean; pieceLabel?: Partial<TWChartPieceLabel> };
    colors?: Color[];
    legend?: boolean;
    type?: string;
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

export interface AppNotification {
    id?: string;
    icon?: string;
    message: string;
    time?: string | Date;
    status: string;
}

export type AppAlertDialogTypes = 'success' | 'info' | 'warning' | 'error';

export interface AppAlertDialogData {
    heading: string;
    message: string;
    close: () => void;
    type: AppAlertDialogTypes;
}

export type ReminderTaskDialogTypes = 'makecall' | 'meeting' | 'changestate';

export interface ReminderTaskDialogData {
    title: string;
    message: string;
    accept: () => void;
    reject: () => void;
    snooze: () => void;
    type: AppAlertDialogTypes;
}
