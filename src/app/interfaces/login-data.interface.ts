import { IAgentData, IConfig, IConnection } from 'tmac-sdk';

export interface ILoginData {
    agentData: IAgentData;
    config: IConfig;
    connectionData: IConnection;
}
