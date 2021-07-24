import { ILogger, TUtils } from '@tmac/sdk';

/**
 * Shared wrapper
 */
export class SharedWrapper {
    /**
     * Logger ref
     */
    logger: ILogger;

    constructor() {
        this.logger = TUtils.Logger.register(`AD-${this.constructor.name}`);
    }
}
