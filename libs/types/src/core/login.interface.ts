/**
 * Login page config
 */
export type LoginConfig = {
    /**
     * Types of login modes
     */
    Modes: Modes;
    /**
     * Config for Face auth server
     */
    FaceAuth: FaceAuth;
    /**
     * Flag to enable Domain list dropdown
     */
    DomainListEnabled: boolean;
    /**
     * Config for login password.
     * LDAP password and station passwords are available.
     */
    Password: Password;
    /**
     * @deprecated Use "Password" instead
     */
    PasswordEnabled: boolean;
    /**
     * Flag to enable station input when mode is disabled
     */
    StationEnabled: boolean;
    /**
     * Flag to make lanid field readonly
     */
    DisableLanId: boolean;
    /**
     * Flag to prompt agent id if invalid lanid is provided
     */
    PromptAgentIdOnInvalidLanId: boolean;
    /**
     * Config to open mainpage in a differnent window after login
     */
    MultiWindowMode: MultiWindowMode;
    /**
     * Threshold for SSO link expiry
     */
    SSOLinkExpiry: number;
};

/**
 * Types of login modes
 */
export type Modes = {
    /**
     * Flag to enable login modes.
     * This flag wil enable Login to PBX and Webphone checkboxes.
     */
    Enabled: boolean;
    /**
     * Types of available modes.
     * - pbx: Station enabled, login to PBX will be checked
     * - pbxms: Station enabled, login to PBX and Webphone will be checked
     * - ms: Station enabled, login to Webphone will be checked
     * Station is disabled by default (nonpbx)
     */
    Type: 'pbx' | 'pbxms' | 'ms' | 'nonpbx';
};

/**
 * Config for login password.
 * LDAP password and station passwords are available.
 */
export type Password = {
    /**
     * Flag to enable agent login via password
     */
    Agent: boolean;
    /**
     * Flag to enable station login via password
     */
    Station: boolean;
};

/**
 * Config for Face auth server
 */
export type FaceAuth = {
    /**
     * Flag to enable face authentication
     */
    Enabled: boolean;
    /**
     * Face auth server URL
     */
    AuthServerUrl: string;
};

/**
 * Config to open mainpage in a differnent window after login
 */
export type MultiWindowMode = {
    /**
     * Flag to enable multi window mode
     */
    Enabled: boolean;
    /**
     * Width of the new main page window opened after login.
     */
    Width: number;
    /**
     * Width of the new main page window opened after login.
     */
    Height: number;
    /**
     * Flag to consider new window width and height in pixels
     */
    PixelDimension: boolean;
};
