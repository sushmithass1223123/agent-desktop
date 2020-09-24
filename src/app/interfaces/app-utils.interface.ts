import { MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { ChartDataSets, ChartOptions } from 'chart.js';
import { Moment } from 'moment';
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
    isAgent?: boolean;
    messageId?: string;
    message?: string;
    type?: string;
    time?: string | Date | Moment;
    divider?: boolean;
    attachment?: {
        src: string;
        type: string;
        name: string;
    };
}

export interface AppNotification {
    /**
     * ID of the app notification
     */
    id?: string;
    /**
     * Icon of the app notification
     */
    icon?: string;
    /**
     * Message of app notification
     */
    message: string;
    /**
     * Time of the app notification
     */
    time?: string | Date;
    /**
     * Status of the app notification 
     */
    status: 'new' | 'read';
}

export type SnackbarStateTypes = 'info' | 'loading' | 'warning' | 'success' | 'failure';

export type AppAlertDialogTypes = 'success' | 'info' | 'warning' | 'error';

export interface AppAlertDialogData {
    /**
     * Heading of app alert
     */
    heading: string;
    /**
     * Message of app alert
     */
    message: string;
    /**
     * Method to close the app alert
     */
    close: () => void;
    /**
     * Type of app alert which is of type AppAlertDialogTypes
     */
    type: AppAlertDialogTypes;
}

export type ReminderTaskDialogTypes = 'makecall' | 'meeting' | 'changestate' | 'dacrequest';

export interface ReminderTaskDialogData {
    /**
     * Title of the reminder task dialog
     */
    title: string;
    /**
     * Message of the reminder task dialog
     */
    message: string;
    /**
     * Method to accept the reminder task
     */
    accept: () => void;
    /**
     * Method to reject the reminder task
     */
    reject: () => void;
    /**
     * Method to snooze the reminder task
     */
    snooze: () => void;
    /**
     * Type of reminder task of type AppAlertDialogTypes
     */
    type: AppAlertDialogTypes;
}

export type AppConfirmDialogTypes = 'takeoverSession' | 'endInteraction' | 'closeInteraction' | 'logout';

export interface AppConfirmDialogData {
    /**
     * Title of the confirmation dialog
     */
    title: string;
    /**
     * Message of the confirmation dialog
     */
    message: string;
    /**
     * Type of confirmation of type AppConfirmDialogTypes
     */
    type: AppConfirmDialogTypes;
    /**
     * Method to confirm
     */
    confirm: () => void;
    /**
     * Method to cancel
     */
    cancel: () => void;
}

export interface AppSnackBarArgs {
    /**
     * Type of app snackbar
     */
    type: string;
    /**
     * Message to show in snackbar
     */
    message: string;
    /**
     * State of snackbar of [ 'info' | 'success' | 'warning' | 'error'], info by default
     */
    state?: 'info' | 'success' | 'warning' | 'danger';
    /**
     * Vertical Postion of snackbar of type MatSnackBarVerticalPosition, default 'top'
     */
    vPos?: MatSnackBarVerticalPosition;
    /**
     * Horizontal Postion of snackbar of type MatSnackBarVerticalPosition, default 'center'
     */
    hPos?: MatSnackBarHorizontalPosition;
    /**
     * Duration of snackbar, 5000 by default
     */
    duration?: number;
}
