export interface ReqCampaignContact {
    campaignName: string;
    campaignId: string;
    name: string;
    phoneNumber: string;
    email: string;
    dnd: boolean;
    channel: string;
    directAgent: string;
    directAgentScheduleTime: string;
    retryCount: number;
    dynamicValues: string;
}
