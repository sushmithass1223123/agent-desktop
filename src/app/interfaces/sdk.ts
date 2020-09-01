import { AgentChannelDataModel } from 'tmac-sdk';

export interface AgentChannelDetailsEventRes {
    AgentId: string;
    Channels: AgentChannelDataModel[];
    Duration: number;
}
