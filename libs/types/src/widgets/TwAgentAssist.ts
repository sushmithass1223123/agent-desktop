import { Widget } from '..';

export type TwAgentAssist = Widget<TwAgentAssistData>;

export interface TwAgentAssistData {
    Confidence: number;
    AssistWidgetUrl: string;
    Title: string;
    Icon: string;
    Width: number;
    Height: number;
    Actions: string[];
    ViewState: string;
}
