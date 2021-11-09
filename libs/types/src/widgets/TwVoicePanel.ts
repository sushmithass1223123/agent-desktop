import { Widget } from '..';

export type TwVoicePanel = Widget<TwVoicePanelData>;

export interface TwVoicePanelData {
    Widgets: any[];
    Path: string;
    RouteOnInteraction: string;
}
