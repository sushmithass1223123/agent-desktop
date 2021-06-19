import { AVApiConfig } from '@tmac/sdk';
import { IWidget } from './widget.interface';

export interface IAppConfig {
    /**
     * Login page configurations
     */
    Login: {
        /**
         * Login modes
         */
        Modes: {
            /**
             * To enable
             */
            Enabled: boolean;
            /**
             * Types of login mode
             */
            Type: 'pbx' | 'nonpbx' | 'ms' | 'pbxms';
        };
        /**
         * Face authentication
         */
        FaceAuth: {
            /**
             * To enable
             */
            Enabled: boolean;
            /**
             * Face authentication api url
             */
            AuthServerUrl: string;
        };
        /**
         * To enable domain list dropdown
         */
        DomainListEnabled: boolean;
        /**
         * To enable password
         */
        Password: {
            /**
             * To enable agent password input
             */
            Agent: boolean;
            /**
             * To enable station password input
             */
            Station: boolean;
        };
        /**
         * To enable station input, note: this config can be overridden by the 'Modes'
         */
        StationEnabled: boolean;
        /**
         * To disable lan id input
         */
        DisableLanId: boolean;
        /**
         * To prompt user to enter agent id when invalid lan id detected during login
         */
        PromptAgentIdOnInvalidLanId: boolean;
        /**
         * Multi window config to open mainscreen in new window
         */
        MultiWindowMode: {
            /**
             * To enable
             */
            Enabled: boolean;
            /**
             * Width of main window
             */
            Width: number;
            /**
             * Height of main window
             */
            Height: number;
            /**
             * To enable pixel dimension
             */
            PixelDimension: boolean;
        };
    };
    /**
     * Main page configurations
     */
    Main: {
        /**
         * Toolbar section
         */
        Toolbar: {
            /**
             * Toolbar widgets
             */
            Widgets: IWidget[];
        };
        /**
         * Navbar section
         */
        Navbar: {
            /**
             * Navbar widgets
             */
            Widgets: IWidget[];
        };
        /**
         * Content page section
         */
        Content: {
            /**
             * Toolbar widgets
             */
            Widgets: IWidget[];
        };
        /**
         * Main AOT section
         */
        AOT: {
            /**
             * AOT widgets
             */
            Widgets: IWidget[];
        };
        /**
         * Global urls section
         */
        Urls: {
            /**
             * Dashboard server urls (TMACDataServers)
             */
            DashboardServerUrls: string[];
            /**
             * File server url
             */
            FileServerUrl: {
                /**
                 * SMM file server
                 */
                SMM: string;
                /**
                 * Media proxy file api server
                 */
                MediaProxy: string;
            };
            /**
             * Campaign manager client web service url
             */
            TCMClient: string;
        };
    };
    /**
     * Application level configurations
     */
    AppConfigs: {
        /**
         * App window title
         */
        TitleName: string;
        /**
         * App theme
         */
        Theme: AppThemeType;
        /**
         * App font
         */
        Font: AppFontType;
        /**
         * App logo
         */
        Logos: {
            /**
             * Favorite icon url
             */
            Favicon: string;
            /**
             * Default logos
             */
            Default: {
                /**
                 * Large size
                 */
                Large: {
                    /**
                     * Url of logo
                     */
                    Src: string;
                    /**
                     * Width of logo
                     */
                    Width: number;
                    /**
                     * Height of logo
                     */
                    Height: number;
                };
                /**
                 * Small size
                 */
                Small: {
                    /**
                     * Url of logo
                     */
                    Src: string;
                    /**
                     * Width of logo
                     */
                    Width: number;
                    /**
                     * Height of logo
                     */
                    Height: number;
                };
                /**
                 * Alternative name
                 */
                Alt: string;
            };
            /**
             * Customer logo
             */
            Customer: {
                /**
                 * Large size
                 */
                Large: {
                    /**
                     * Url of logo
                     */
                    Src: string;
                    /**
                     * Width of logo
                     */
                    Width: number;
                    /**
                     * Height of logo
                     */
                    Height: number;
                };
                /**
                 * Small size
                 */
                Small: {
                    /**
                     * Url of logo
                     */
                    Src: string;
                    /**
                     * Width of logo
                     */
                    Width: number;
                    /**
                     * Height of logo
                     */
                    Height: number;
                };
                /**
                 * Alternative name
                 */
                Alt: string;
            };
        };
        /**
         * Flag to diable refresh of page by user
         */
        RefreshDisabled: boolean;
        /**
         * Flag to disable opening of dev tools by user
         */
        DevToolsDisabled: boolean;
        /**
         * Notification settings
         */
        Notifications: {
            /**
             * Flag to enable/disable sound
             */
            Sounds: boolean;
            /**
             * Sound level from 0 to 1, decimal accepted
             */
            SoundLevel: number;
            /**
             * Flag to enable/disable browser notification
             */
            DesktopAlerts: true;
            /**
             * Browser notification timeout (seconds * 1000)
             */
            DesktopAlertTimeout: number;
            /**
             * App alert timeout (seconds * 1000)
             */
            AppAlertTimeout: number;
        };
        /**
         * AV configurations
         */
        AV: AVApiConfig;
        /**
         * SDK configurations
         */
        SDK: any;
    };
}

type AppThemeType =
    | 'theme-default'
    | 'theme-default-1'
    | 'theme-default-2'
    | 'theme-teal-red'
    | 'theme-default-dark'
    | 'theme-blue-grey-dark'
    | 'theme-pink-grey-dark';

type AppFontType = 'wf-muli' | 'wf-montserrat' | 'wf-source-sans-pro';
