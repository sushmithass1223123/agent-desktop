import { Type } from '@angular/core';
import { IWidget } from 'app/interfaces';

export class TWidget {
    constructor(public component: Type<any>, public data: IWidget) { }
}
