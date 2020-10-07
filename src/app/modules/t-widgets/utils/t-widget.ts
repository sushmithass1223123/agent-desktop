import { Type } from '@angular/core';
import { IWidget } from 'app/interfaces';

/**
 * Used for getting component and data from appjson in a class / object form
 */
export class TWidget {
    constructor(public component: Type<any>, public data: IWidget) { }
}
