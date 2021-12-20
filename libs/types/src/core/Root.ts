import { AppConfigs } from './AppConfig';
import { Login } from './Login';
import { Main } from './Main';

export interface AppRootConfig {
    /**
     * Development JSON config
     */
    Login: Login;
    Main: Main;
    AppConfigs: AppConfigs;
    Version: string;

    /**
     * Production JSON config
     */
    ProxyUrl?: string[];
    ConfigMode?: 'remote' | 'local';
}
