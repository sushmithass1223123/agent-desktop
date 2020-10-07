// tslint:disable: directive-selector
import { Directive, ViewContainerRef } from '@angular/core';

/**
 * Need More description
 * Tw template directive
 */
@Directive({
    selector: '[widgetTemplate]',
})
export class TwTemplateDirective {
    constructor(public viewContainerRef: ViewContainerRef) { }
}
