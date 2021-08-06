import { Directive } from '@angular/core';
import { ILogger, TUtils } from '@tmac/sdk';

@Directive()
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
