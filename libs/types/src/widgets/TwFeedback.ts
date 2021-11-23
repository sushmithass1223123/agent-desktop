import { Widget } from '..';

export type TwFeedback = Widget<TwFeedback>;

export interface TwFeedbackData {
    /**
     * Source for reusability
     */
    Source: 'dashboard' | 'supervisor';
}
