import { AppConfigs } from './AppConfig';
import { Login } from './Login';
import { Main } from './Main';

export interface AppRootConfig {
    Login: Login;
    Main: Main;
    AppConfigs: AppConfigs;
}
