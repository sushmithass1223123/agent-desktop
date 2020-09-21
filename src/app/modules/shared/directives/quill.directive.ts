import { Directive, ElementRef, OnInit } from '@angular/core';

@Directive({
    selector: '[quill]'
})
export class QuillDirective implements OnInit {
    constructor(private el: ElementRef) {}

    ngOnInit() {}
}
