import { AOTWidget, Widget } from './Widget';

export interface Main {
    Toolbar: Toolbar;
    Navbar: Navbar;
    Content: Content;
    AOT: AOTConf;
    Urls: Urls;
}

export interface AOTConf {
    Widgets: AOTWidget[];
}

export interface Toolbar {
    Widgets: Widget[];
}

export interface Navbar {
    Widgets: TopBottomWidgets;
}

export interface TopBottomWidgets {
    Top: Widget[];
    Bottom: Widget[];
}
export interface Content {
    Widgets: Widget[];
}

export interface Urls {
    DashboardServerUrls: string[];
    FileServerUrl: FileServerUrl;
    TCMClient: string;
}

export interface FileServerUrl {
    SMM: string;
    MediaProxy: string;
}
