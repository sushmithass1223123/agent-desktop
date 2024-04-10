import { AOTWidget, Widget } from './widget.interface';

/**
 * Main config
 */
export type Main = {
    /**
     * Toolbar widgets config
     */
    Toolbar: Toolbar;
    /**
     * Navbar widgets config
     */
    Navbar: Navbar;
    /**
     * Content widgets config
     */
    Content: Content;
    /**
     * AOT widgetsconfig
     */
    AOT: AOTConf;
    /**
     * URLs config. This config is used across all the widgets.
     */
    Urls: Urls;
};

/**
 * AOT config
 */
export type AOTConf = {
    /**
     * List of AOT widgets
     */
    Widgets: AOTWidget[];
};

/**
 * Toolbar
 */
export type Toolbar = {
    /**
     * List of toolbar widgets
     */
    Widgets: Widget[];
};

/**
 * Navbar config
 */
export type Navbar = {
    /**
     * Flag to hold active interactions on switching between tabs
     */
    HoldInteractionOnTabChange: boolean;
    /**
     * Top and Bottom navbar widgets list
     */
    Widgets: TopBottomWidgets;
};

/**
 * Top and Bottom navbar widgets list
 */
export type TopBottomWidgets = {
    /**
     * List of widgets in the top section of navbar
     */
    Top: Widget[];
    /**
     * List of widgets in the bottom section of navbar
     */
    Bottom: Widget[];
};
/**
 * Content widget config
 */
export type Content = {
    /**
     * List of content widgets
     */
    Widgets: Widget[];
};

/**
 * URLs config
 */
export type Urls = {
    /**
     * List of Dashboard Server Urls
     */
    DashboardServerUrls: string[];
    /**
     * File server Url config
     */
    FileServerUrl: FileServerUrl;
    /**
     * TCM Client Endpoint
     */
    TCMClient: string;
};

/**
 * Fileserver Url config
 */
export type FileServerUrl = {
    /**
     * SMM endpoint
     */
    SMM: string;
    /**
     * MediaProxy Endpoint
     */
    MediaProxy: string;
};
