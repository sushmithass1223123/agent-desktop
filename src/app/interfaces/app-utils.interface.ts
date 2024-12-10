import { MatLegacySnackBarHorizontalPosition as MatSnackBarHorizontalPosition, MatLegacySnackBarVerticalPosition as MatSnackBarVerticalPosition } from '@angular/material/legacy-snack-bar';
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
     * Message that this message is a reply to
     */
    repliedToMessage?: ChatTranscripts;
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
        /**
         * Angle of view
         */
        angle: number;
    };
    /**
     * Attachment
     */
    customTemplate?: any;
    /**
     * Divider message
     */
    dividerMessage?: boolean;
    /**
     * Message to server
     */
    messageToServer?: {
        /**
         * Message to send
         */
        message: string;
        /**
         * Message template id
         */
        templateId: string;
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
    message: string | any;
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

export type AppConfirmDialogTypes = 'takeoverSession' | 'endInteraction' | 'closeInteraction' | 'logout' | 'generic' | 'endCall';

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

export type SnackbarStateTypes = 'info' | 'loading' | 'warning' | 'success' | 'failure' | 'close';

export interface SnackBarArgs {
    /**
     * Message to show in snackbar
     */
    message: string;
    /**
     * State of snackbar of SnackbarStateTypes, success by default
     */
    state?: SnackbarStateTypes;
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
    /**
     * On click of snackbar
     */
    onClick?: () => void;
    /**
     * On close of snackbar
     */
    onClose?: () => void;
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
    /**
     * To disable desktop notification for app snackbar
     */
    disableNotification?: boolean;
    /**
     * performs action when snackbar clicked
     */
    onClick?: (...args) => void;
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
    /**
     * Message Classes
     */
    messageClasses?: string;
    /**
     * Button's custom msg for confirm button
     */
    yesMessage?: string;
    /**
     * Button's custom msg for cancel button
     */
    noMessage?: string;
    /**
     * close icon for the dialog
     */
    closeIcon?: boolean;

    /**
     * to enable confirmation on closing the dialog
     */
    confirmClose?: boolean;

    /**
     * message to be shown on confirmation dialog
     */

    confirmMessage?: string;
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

export type FuseBgConf = {
    /**
     * Body color class of fuse config
     */
    body: string;
    /**
     * Content color class of fuse config
     */
    content: string;
    /**
     * Header color class of fuse config
     */
    header: string;
};

export interface IPostMessage {
    /**
     * Id/Name of frame
     */
    name: string;
    /**
     * Function to call
     */
    function: string;
    /**
     * Callback function to be invoked
     */
    callback: any;
    /**
     * Data to send
     */
    data: any;
    /**
     * Source name of the app
     */
    source: string;
    /**
     * Destination which should be tmac
     */
    destination: string;
    /**
     * User object
     */
    userObject: any;
}

export interface IMaskData {
    /**
     * To mask with char
     */
    MaskWith?: string;
    /**
     * Maximum masked charecters
     */
    MaxMaskedChars?: number;
    /**
     * Unmasked start charecters
     */
    UnMaskedStartChars?: number;
    /**
     * Unmasked end charecters
     */
    UnMaskedEndChars?: number;
}

export interface CustomerInfo {
    /**
     * Title
     */
    Title: string;
    /**
     * Value Source
     */
    ValueSource: string;
    /**
     * Value
     */
    Value?: string;
    /**
     * Default Value
     */
    DefaultValue: string;
    /**
     * Width of column
     */
    Width?: string;
    /**
     * To mask value
     */
    MaskData?: IMaskData | boolean;
}

export interface CommonWidgetData {
    /**
     * Path of route
     */
    Path: string;
    /**
     * Route on interaction flag
     */
    RouteOnInteraction: boolean;
}

/**
 * Bookmark data
 * Each node has a name and an optional list of children.
 */
export interface BookmarkItem {
    /**
     * Id of bookmark
     */
    id: string;
    /**
     *  Id of a bookmark of type "folder"
     */
    parentId: string;
    /**
     * Id of user
     */
    userId: string;
    /**
     * Type of user (agent, customer, etc.)
     */
    userType: string;
    /**
     * Name of bookmark
     */
    bookmarkName: string;
    /**
     * Type of bookmark
     */
    bookmarkType: 'folder' | 'url';
    /**
     * Url link if the bookmarkType is "url". Keep it empty for the bookmarkType is "folder"
     */
    bookmarkData: string;
    /**
     * Status of bookmark. 0=disabled, 1=enabled
     */
    bookmarkStatus: number;
    /**
     * Bookmark created by user
     */
    createdBy?: string;
    /**
     * Created on date
     */
    createdOn?: Date;
    /**
     * Updated on date
     */
    updatedBy?: string;
    /**
     * Updated on date
     */
    updatedOn?: Date;
    /**
     * Any other JSON string
     */
    otherData?: string;
    /**
     * Children node
     */
    children?: BookmarkItem[];
}

export interface MediaStreamerResponse {
    /**
     * Success flag
     */
    isSuccess: boolean;
    /**
     * Result message
     */
    message: 'SUCCESS' | 'FAILED';
    /**
     * Result object
     */
    result?: {
        /**
         * Name of the file
         */
        original_name: string;
        /**
         * Size of the file
         */
        size: number;
        /**
         * Generic UUID for the upload
         */
        interaction_id: string;
        /**
         * Session id of the interaction
         */
        conv_id: string;
        /**
         * File uploaded stream url
         */
        streamURL: string;
        /**
         * File uploaded file url
         */
        fileUrl: string;
        /**
         * File uploaded download url
         */
        downloadURL: string;
        /**
         * Content type of the file
         */
        contentType: string;
    };
}

export interface MediaStreamerSingleResponse<T> {
    /**
     * Success flag
     */
    isSuccess: boolean;
    /**
     * Result message
     */
    message: 'SUCCESS' | 'FAILED';
    /**
     * Result object
     */
    result?: T;
}

export interface MediaStreamerMultiResponse<T> {
    /**
     * Success flag
     */
    isSuccess: boolean;
    /**
     * Result message
     */
    message: 'SUCCESS' | 'FAILED';
    /**
     * Result object
     */
    result?: Array<T>;
}

export interface MediaStreamerMetaResponse {
    /**
     * Name of the file
     */
    original_name: string;
    /**
     * Size of the file
     */
    size: number;
    /**
     * Generic UUID for the upload
     */
    interaction_id: string;
    /**
     * Session id of the interaction
     */
    conv_id: string;
    /**
     * File uploaded stream url
     */
    streamURL: string;
    /**
     * File uploaded file url
     */
    fileUrl: string;
    /**
     * File uploaded download url
     */
    downloadURL: string;
    /**
     * Content type of the file
     */
    contentType: string;
    /**
     * Archived status of the file
     */
    archiveStatus: string | undefined | null;
    /**
     * Restore status of the file
     */
    restoreStatus: boolean | undefined | null;
    /**
     * File file is not able to retrieve
     */
    fileError: boolean | undefined | null;
}
