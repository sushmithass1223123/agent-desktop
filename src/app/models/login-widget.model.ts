import { FaceAuth, Modes, MultiWindowMode, Password } from '@ad/types';

/**
 * Login model
 */
export class LoginWidgetModel {
    Modes: Modes;
    FaceAuth: FaceAuth;
    DomainListEnabled: boolean;
    Password: Password;
    StationEnabled: boolean;
    DisableLanId: boolean;
    PromptAgentIdOnInvalidLanId: boolean;
    MultiWindowMode: MultiWindowMode;
    SSOLinkExpiry: number;
    ItemTwo: any;

    constructor() {
        this.Modes = {
            Enabled: false,
            Type: 'nonpbx'
        };
        this.FaceAuth = {
            Enabled: false,
            AuthServerUrl: ''
        };
        this.DomainListEnabled = false;
        this.Password = {
            Agent: false,
            Station: false
        };
        this.StationEnabled = false;
        this.DisableLanId = false;
        this.PromptAgentIdOnInvalidLanId = false;
        this.MultiWindowMode = {
            Enabled: false,
            Height: 100,
            Width: 100,
            PixelDimension: false
        };
        this.SSOLinkExpiry = 0;
        this.ItemTwo = []
    }
}
