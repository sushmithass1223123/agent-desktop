import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { IWidget } from 'app/interfaces';

@Component({
    selector: 'tw-voice-controls',
    templateUrl: './tw-voice-controls.component.html',
    styleUrls: ['./tw-voice-controls.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwVoiceControlsComponent extends TWidgetWrapper implements OnInit, OnDestroy {

    @Input() data: IWidget;

    @Output() maximizeEvent = new EventEmitter();
    @Output() floatEvent = new EventEmitter();
    @Output() collapseEvent = new EventEmitter();

    constructor() {
        super();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        console.log('TwVoiceControlsComponent', this.data.InteractionDetails);

    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        this.unsubscribeAll.next();
        this.unsubscribeAll.complete();
    }
}
