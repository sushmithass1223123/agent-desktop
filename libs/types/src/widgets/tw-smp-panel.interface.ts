import { InteractionWidget } from '..';

/**
 * Email panel widget contains the tw-email-controls and tw-customer-journey widgets
 */
export interface TwSmpPanel extends InteractionWidget<TwSmpPanelData> {}

/**
 * Data config of the email panel
 */
export type TwSmpPanelData = {
    /**
     * List of widgets inside the email panel
     */
    Widgets: any[];
};
