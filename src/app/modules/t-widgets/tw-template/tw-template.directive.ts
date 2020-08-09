// tslint:disable: directive-selector
import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
    selector: '[widgetTemplate]',
})
export class TwTemplateDirective {
    constructor(public viewContainerRef: ViewContainerRef) { }
}
