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

    constructor(source?: string) {
        this.logger = TUtils.Logger.register(`AD-${source ?? this.constructor.name}`);
    }
}
