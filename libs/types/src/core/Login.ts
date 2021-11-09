export interface Login {
    Modes: Modes;
    FaceAuth: FaceAuth;
    DomainListEnabled: boolean;
    Password: Password;
    StationEnabled: boolean;
    DisableLanId: boolean;
    PromptAgentIdOnInvalidLanId: boolean;
    MultiWindowMode: MultiWindowMode;
}

export interface Modes {
    Enabled: boolean;
    Type: string;
}

export interface Password {
    Agent: boolean;
    Station: boolean;
}

export interface FaceAuth {
    Enabled: boolean;
    AuthServerUrl: string;
}

export interface MultiWindowMode {
    Enabled: boolean;
    Width: number;
    Height: number;
    PixelDimension: boolean;
}
