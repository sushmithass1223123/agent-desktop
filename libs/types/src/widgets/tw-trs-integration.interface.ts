import { Widget } from '..';

/**
 * TRS integration widget.
 */
export interface TwTrsIntegration extends Widget<TwTrsIntegrationData> {}

/**
 * TRS integration widget's "Data" config
 */
export type TwTrsIntegrationData = {
    /**
     * Connection urls
     */
    Urls: string[];
};
