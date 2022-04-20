import { Widget } from '..';

/**
 * Logout component renders a logout button on the toolbar widgget
 * Example comfig:
 * ```json
 * {
 *   "Name": "Logout Button",
 *   "Description": "",
 *   "Type": "tw-logout",
 *   "Config": { "Enabled": true },
 *   "Data": { "LogoutAux": "logout", "AllowLogoutOnOpenInteractions": false }
 * }
 * ```
 */
export interface TwLogout extends Widget<TwLogoutData> {}

export type TwLogoutData = {
    /**
     * Logout aux
     */
    LogoutAux: string;
    /**
     * Flag to allow logout on open tabs
     */
    AllowLogoutOnOpenInteractions: boolean;
    /**
     * Flag to allow logout button on available status when no "LogoutAux" is configured.
     * This config will have no impact if "LogoutAux" is configured.
     */
    AllowLogoutOnAvailable: boolean;
};
