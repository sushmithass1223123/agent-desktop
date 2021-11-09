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
}

export type AgentSkillListAgentSources = 'station' | 'agentId';
export type AgentSkillListSkillSources = 'skill' | 'vdn';
export type AgentSkillListSourceObject<
    /**
     * Type of Use Key. Default: any
     */
    T = any,
    /**
     * Type of Display Key. Default : any
     */
    K = any
> = {
    /**
     * This agent source is forwarded to any api calls / value assigning
     */
    Use: T;
    /**
     * This agent source is displayed
     */
    Display: K;
    /**
     * Allow freetext to redirect user to specified source's use key
     */
    FreeTextAllowed: boolean;
};

export interface AgentSkillListData {
    /**
     * Type of dialog
     */
    type: 'makeCall' | 'transferCall' | 'conferenceCall' | 'transferChat' | 'conferenceChat' | 'transferEmail' | 'transferFax' | 'pushChat';
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
         * Consult allowed flag
         */
        consult: boolean;
        /**
         * Comments allowed flag
         */
        comments: boolean;
        /**
         * Blind allowed flag
         */
        blind: boolean;
        /**
         * Source to select
         */
        source: AgentSkillListAgentSources | AgentSkillListSourceObject<AgentSkillListAgentSources, AgentSkillListAgentSources | 'agentName'>;
        /**
         * Allowed states to do action
         */
        allowedStates: string[];
        /**
         * Allowed Columns
         */
        columns?: string[];
        /**
         * To filter agent list based on team visibility
         */
        teamFilter?: boolean;
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
         * Consult allowed flag
         */
        consult: boolean;
        /**
         * Comments allowed flag
         */
        comments: boolean;
        /**
         * Blind allowed flag
         */
        blind: boolean;
        /**
         * Source to select
         */
        source: AgentSkillListSkillSources | AgentSkillListSourceObject<AgentSkillListSkillSources, AgentSkillListSkillSources>;
        /**
         * Channel prefix to filter skill list
         */
        channelPrfix: string[];
        /**
         * Allowed Columns
         */
        columns?: string[];
    };
    /**
     * speed dial settings
     */
    speedDial?: {
        /**
         * Agent allowed flag
         */
        allowed: boolean;
        /**
         * Consult allowed flag
         */
        consult: boolean;
        /**
         * Comments allowed flag
         */
        comments: boolean;
        /**
         * Blind allowed flag
         */
        blind: boolean;
        /**
         * Source to select
         */
        source: AgentSkillListSourceObject<'Name' | 'Number', 'Name' | 'Number'>;
        /**
         * Allowed Columns
         */
        columns?: string[];
        /**
         * To filter agent list based on team visibility
         */
        teamFilter?: boolean;
    };

    dynamicLists?: {
        label: string;
        placeholder: string;
        data: any[];
        columns: string[];
        selection: string;
        consult: boolean;
        blind: boolean;
        comments: boolean;
    }[];

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

export interface AgentSkillRef {
    /**
     * Allowed flag
     */
    Allowed: boolean;
    /**
     * Agent ref
     */
    Agent: {
        /**
         * Agent allowed flag
         */
        Allowed: boolean;
        /**
         * Consult allowed flag
         */
        Consult: boolean;
        /**
         * Blind allowed flag
         */
        Blind: boolean;
        /**
         * Comments allowed flag
         */
        Comments: boolean;
        /**
         * Source for agent actions
         */
        Source: AgentSkillListSourceObject;
        /**
         * Allowed state for action
         */
        AllowedStates: [];
        /**
         * Team filter enabled flag
         */
        TeamFilter: boolean;
        /**
         * Columns to show
         */
        Columns: [];
    };
    /**
     * Skill ref
     */
    Skill: {
        /**
         * Agent allowed flag
         */
        Allowed: boolean;
        /**
         * Consult allowed flag
         */
        Consult: boolean;
        /**
         * Comments allowed flag
         */
        Comments: boolean;
        /**
         * Blind allowed flag
         */
        Blind: boolean;
        /**
         * Source for skill actions
         */
        Source: AgentSkillListSourceObject;
        /**
         * Team filter enabled flag
         */
        TeamFilter: boolean;
        /**
         * Channel prefix to filter
         */
        ChannelPrefix: [];
        /**
         * Columns to show
         */
        Columns: [];
    };

    /**
     * Skill ref
     */
    SpeedDial: {
        /**
         * Agent allowed flag
         */
        Allowed: boolean;
        /**
         * Consult allowed flag
         */
        Consult: boolean;
        /**
         * Comments allowed flag
         */
        Comments: boolean;
        /**
         * Blind allowed flag
         */
        Blind: boolean;
        /**
         * Source for skill actions
         */
        Source: AgentSkillListSourceObject;
        /**
         * Team filter enabled flag
         */
        TeamFilter: boolean;
        /**
         * Columns to show
         */
        Columns: [];
    };
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
    createdBy: string;
    /**
     * Created on date
     */
    createdOn: Date;
    /**
     * Updated on date
     */
    updatedBy: string;
    /**
     * Updated on date
     */
    updatedOn: Date;
    /**
     * Any other JSON string
     */
    otherData: string;
    /**
     * Children node
     */
    children?: BookmarkItem[];
}
