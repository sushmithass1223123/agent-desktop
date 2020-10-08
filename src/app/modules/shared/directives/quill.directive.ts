import { Directive, ElementRef, OnInit } from '@angular/core';

/**
 * Quill directive
 */
@Directive({
    selector: '[quill]'
})
export class QuillDirective implements OnInit {
    constructor(private el: ElementRef) { }

    /**
     * Lifecycle hook
     * @method
     */
    ngOnInit(): void { }
}
