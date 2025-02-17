import { AppFontType, AppThemeType, AVConfig, Logos, Notifications, SDK } from '@ad/types';
import { IConfig } from '@tmac/sdk';
export class AppConfigsModel {
    TitleName: string;
    Theme: AppThemeType;
    Font: AppFontType;
    Logos: Logos;
    RefreshDisabled: boolean;
    DevToolsDisabled: boolean;
    Notifications: Notifications;
    AddAOTWidgetEnabled: boolean;
    CheckForResolution: boolean;
    AV: AVConfig;
    SDK: SDK & IConfig;

    constructor() {
        this.TitleName = 'Agent Desktop';
        this.Theme = 'theme-default';
        this.Font = 'wf-roboto';
        this.Logos = {
            Favicon: '',
            Default: {
                Large: { Src: 'assets/images/logos/tetherfi.png', Width: 180, Height: 90 },
                Small: { Src: 'assets/images/logos/tetherfi-logo-round.png', Width: 50, Height: 50 },
                Alt: 'Tetherfi'
            },
            Customer: {
                Large: { Src: 'assets/images/logos/tetherfi.png', Width: 180, Height: 90 },
                Small: { Src: '', Width: 50, Height: 50 },
                Alt: 'Tetherfi'
            }
        };
        this.RefreshDisabled = false;
        this.DevToolsDisabled = false;
        this.Notifications = { Sounds: false, SoundLevel: 0, DesktopAlerts: false, DesktopAlertTimeout: 0, AppAlertTimeout: 0 };
        this.AddAOTWidgetEnabled = false;
        this.CheckForResolution = false;
        this.AV = {} as AVConfig;
        this.SDK = {
            proxy: {
                urls: [],
                type: 'soap',
                timeout: 60
            },
            signalRProxy: { enabled: false, logging: true, protocol: 'webSockets', timeout: 10, fallback: true },
            logging: {
                enabled: true,
                level: { debug: true, info: true, warn: true, error: true },
                remote: { enabled: true, timeout: 30, count: 30 },
                sdkMethods: true,
                sdkEvents: true
            },
            customScripts: []
        } as SDK & IConfig;
    }
}
