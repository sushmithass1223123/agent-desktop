import { MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { ChartDataSets, ChartOptions } from 'chart.js';
import { Moment } from 'moment';
import { Color, SingleOrMultiDataSet } from 'ng2-charts';

export interface TWChartPieceLabel {
    /**
     * render 'label', 'value', 'percentage', 'image' or custom function, default is 'percentage'
     */
    render: 'value';

    /**
     * precision for percentage, default is 0
     */
    precision: number;
    /**
     *
     *  identifies whether or not labels of value 0 are displayed, default is false
     */
    showZero: boolean;

    /**
     *
     *  font size, default is defaultFontSize
     */
    fontSize: number;

    /**
     *
     *  font color, can be color array for each data or function for dynamic color, default is defaultFontColor
     */
    fontColor: string;

    /**
     *
     *  font style, default is defaultFontStyle
     */
    fontStyle: 'normal' | 'bold' | 'italic';

    /**
     *
     *  font family, default is defaultFontFamily
     */
    fontFamily: string;

    /**
     *
     *  draw label in arc, default is false
     */
    arc: boolean;

    /**
     * position to draw label, available value is 'default', 'border' and 'outside'
     * position to draw label, available value is 'default', 'border' and 'outside'
     */
    position: 'default' | 'border' | 'outside';

    /**
     *  draw label even it's overlap, default is false
     */
    overlap: boolean;

    /**
     * show the real calculated percentages from the values and don't apply the additional logic to fit the percentages to 100 in total, default is false
     */
    showActualPercentages: boolean;

    /**
     * set images when `render` is 'image'
     */
    images: {
        /**
         * Sorce of image
         */
        src: string;
        /**
         * Width of image
         */
        width: number;
        /**
         * Height of image
         */
        height: number;
    }[];

    /**
     * available only when position = 'outside'
     * if value = true show a callout arrow to label
     */
    segment: boolean;

    /**
     * available only when position = 'outside'
     * stroke color for segment (if value = 'auto' use series backgroundColor)
     */
    segmentColor: string;
}

export interface TwChartConfig {
    /**
     * Data for chart
     */
    data?: SingleOrMultiDataSet[];
    /**
     * Multiple Datasets for chart
     */
    datasets?: ChartDataSets[];
    /**
     * Labels for chart
     */
    labels?: string[] | number[];
    /**
     * Options for chart
     */
    options: ChartOptions & {
        /**
         * Set feedback Emoji
         */
        setFeedbackEmoji?: boolean;
        /**
         * Piece label
         */
        pieceLabel?: Partial<TWChartPieceLabel>;
    };
    /**
     * Colors for chart
     */
    colors?: Color[];
    /**
     * Legends for chart
     */
    legend?: boolean;
    /**
     * Type of chart
     */
    type?: string;
    /**
     * Refresh method for chart
     */
    refresh?: () => void;
}

export interface ChatTranscripts {
    /**
     * Sender
     */
    who?: string;
    /**
     * Position of chat bubble
     */
    position?: string;
    /**
     * Is agent flag
     */
    isAgent?: boolean;
    /**
     * Message Id
     */
    messageId?: string;
    /**
     * Message
     */
    message?: string;
    /**
     * Message init/sent/delivered flag
     */
    status?: string;
    /**
     * Type
     */
    type?: string;
    /**
     * Time
     */
    time?: Date | Moment;
    /**
     * Divider
     */
    divider?: boolean;
    /**
     * Attachment
     */
    attachment?: {
        /**
         * Source
         */
        src: string;
        /**
         * Type
         */
        type: string;
        /**
         * Name
         */
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
    /**
     * To show alert or not
     */
    showAlert?: boolean;
}

export type SnackbarStateTypes = 'info' | 'loading' | 'warning' | 'success' | 'failure' | 'close';

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

export type ReminderTaskDialogTypes = 'makecall' | 'meeting' | 'changestate' | 'dacrequest' | 'tcmwqvoice' | 'reminder';

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
    snooze: (time?: number) => void;
    /**
     * Type of reminder task of type ReminderTaskDialogTypes
     */
    type: ReminderTaskDialogTypes;
}

export type AppConfirmDialogTypes = 'takeoverSession' | 'endInteraction' | 'closeInteraction' | 'logout' | 'generic';

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

export interface CustomDialogData {
    /**
     * Type of custom dialog
     */
    type: 'alert' | 'prompt' | 'confirm';
    /**
     * Title of custom dialog
     */
    title?: string;
    /**
     * Message for the dialog
     */
    message: any;
}

export interface CustomDialogOtherData {
    /**
     * Minimim Rows
     */
    minRows?: number;
}

export interface AgentSkillListData {
    /**
     * Type of dialog
     */
    type: 'makeCall' | 'transferCall' | 'conferenceCall' | 'transferChat' | 'conferenceChat' | 'transferEmail' | 'transferFax';
    /**
     * Title of dialog
     */
    title?: string;
    /**
     * Agent settings
     */
    agent: {
        /**
         * Agent allowed flag
         */
        allowed: boolean;
        /**
         * BlindD allowed flag
         */
        blind: boolean;
        /**
         * Source to select
         */
        source: 'station' | 'agentId';
        /**
         * Allowed states to do action
         */
        allowedStates: string[];
    };
    /**
     * Skill settings
     */
    skill: {
        /**
         * Agent allowed flag
         */
        allowed: boolean;
        /**
         * BlindD allowed flag
         */
        blind: boolean;
        /**
         * Source to select
         */
        source: 'skill' | 'vdn';
        /**
         * Channel prefix to filter skill list
         */
        channelPrfix: string[];
    };
    /**
     * Interaction Id
     */
    interactionId?: number;
    /**
     * Any extra info to pass
     */
    otherData?: any;
    /**
     *  Callback on close
     */
    callback?: (data?: any) => void;
}

export interface InteractionComment {
    /**
     * User name
     */
    User: string;
    /**
     * Comment message
     */
    Message: string;
    /**
     * Comment added time
     */
    Time: string | Date;
}
