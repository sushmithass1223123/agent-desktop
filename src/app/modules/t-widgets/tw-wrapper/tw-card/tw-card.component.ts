import { Component, ContentChildren, Input, OnInit, QueryList, ViewEncapsulation } from '@angular/core';
import { TFlipDirective } from '@twidgets/utils/t-flip/t-flip.directive';

@Component({
    selector: 'tw-card',
    templateUrl: './tw-card.component.html',
    styleUrls: ['./tw-card.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwCardComponent implements OnInit {
    @ContentChildren(TFlipDirective, { descendants: true })
    toggleBtns: QueryList<TFlipDirective>;
    @Input()
    data: any;

    @Input() fuseConfig: any;

    constructor() {}

    ngOnInit(): void {}
}
