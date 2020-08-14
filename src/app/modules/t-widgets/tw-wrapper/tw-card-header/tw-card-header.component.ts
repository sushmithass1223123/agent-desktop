import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'tw-card-header',
    templateUrl: './tw-card-header.component.html',
    styleUrls: ['./tw-card-header.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwCardHeaderComponent implements OnInit {
    @Input() data: any;

    @Input() fuseConfig: any;

    @Input() widgetState: Record<string, boolean>;

    @Output() maximize = new EventEmitter();
    @Output() float = new EventEmitter();
    @Output() collapse = new EventEmitter();

    constructor() { }

    ngOnInit(): void { }

    maximizeWidget(): void {
        this.maximize.emit();
    }

    floatWidget(): void {
        this.float.emit();
    }

    collapseWidget(): void {
        this.collapse.emit();
    }
}
