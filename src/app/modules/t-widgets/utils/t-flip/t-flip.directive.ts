import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
    selector: '[tWidgetFlip]'
})
export class TFlipDirective {
    /**
     * Constructor
     *
     * @param {ElementRef} elementRef
     */
    constructor(public elementRef: ElementRef) {
        elementRef.nativeElement.style.background = 'red !important';
    }

    @HostListener('click', ['$event'])
    clickCheck(): void {
        console.log('Click works !!');
    }
}
