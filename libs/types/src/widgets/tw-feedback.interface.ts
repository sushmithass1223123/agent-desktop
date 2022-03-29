import { Widget } from '..';

/**
 * Feedback widget
 * @ignore
 */
export interface TwFeedback extends Widget<TwFeedback> {}

/**
 * Feedback widget's data config
 * @ignore
 */
export type TwFeedbackData = {
    /**
     * Source for where the widget is going to be loaded
     */
    Source: 'dashboard' | 'supervisor';
};
