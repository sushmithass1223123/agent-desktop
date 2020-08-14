import { Component, Input, OnDestroy, OnInit, ViewEncapsulation, HostBinding } from '@angular/core';
import { fuseAnimations } from '@fuse/animations';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';

@Component({
    selector: 'tw-voice-panel',
    templateUrl: './tw-voice-panel.component.html',
    styleUrls: ['./tw-voice-panel.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class TwVoicePanelComponent extends TWidgetWrapper implements OnInit, OnDestroy {

    @Input() data: any;

    voicePanelWidgets = [];

    maximized = [
        {
            'tw-voice-controls': false,
            'tw-customer-details': false,
            'tw-customer-journey': false,
        }
    ];

    collapsed = [
        {
            'tw-voice-controls': false,
            'tw-customer-details': false,
            'tw-customer-journey': false,
        }
    ];

    floating = [
        {
            'tw-voice-controls': false,
            'tw-customer-details': false,
            'tw-customer-journey': false,
        }
    ];

    constructor() {
        super();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);
        // get the toolbar menu widgets
        this.voicePanelWidgets = this.data.Data.Widgets || [];
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        this.unsubscribeAll.next();
        this.unsubscribeAll.complete();
    }

    onMaximised(isMaximised: boolean, type: string): void {
        console.log('onMaximised - ' + isMaximised + ' - ' + type);
        this.maximized[type] = isMaximised;
    }

    onCollapsed(isCollapsed: boolean, type: string): void {
        console.log('onCollapsed - ' + isCollapsed + ' - ' + type);
        this.collapsed[type] = isCollapsed;
    }

    onFloating(isFloating: boolean, type: string): void {
        console.log('onFloating - ' + isFloating + ' - ' + type);
        this.floating[type] = isFloating;
    }
}
