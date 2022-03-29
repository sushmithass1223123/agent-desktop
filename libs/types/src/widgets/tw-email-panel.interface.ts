import { InteractionWidget } from '..';

/**
 * Email panel widget contains the tw-email-controls and tw-customer-journey widgets
 */
export interface TwEmailPanel extends InteractionWidget<TwEmailPanelData> {}

/**
 * Data config of the email panel
 */
export type TwEmailPanelData = {
    /**
     * List of widgets inside the email panel
     */
    Widgets: any[];
};
