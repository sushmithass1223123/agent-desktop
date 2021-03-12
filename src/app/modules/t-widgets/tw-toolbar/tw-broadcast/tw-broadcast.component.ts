import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { AppUiService } from '@services/app-ui.service';
import { TWidgetWrapper } from '@twidgets/utils';
import { AgentNotificaitonEvent, SDKClient } from 'tmac-sdk';
/**
 * Broadcat component
 */
@Component({
    selector: 'tw-broadcast',
    templateUrl: './tw-broadcast.component.html',
    styleUrls: ['./tw-broadcast.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwBroadcastComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * App confog data
     */
    @Input() data: any;

    /**
     * Broadcat messgae
     */
    broadcastMessage: string;

    constructor(private appUiService: AppUiService) {
        super();
    }

    /**
     * Lifecycle hook
     * @method
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);
        // register to event
        SDKClient.events.on('AgentNotificaitonEvent', this.AgentNotificaitonEvent);
    }

    /**
     * Lifecycle hoook
     * @method
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        // unregister from event
        SDKClient.events.off('AgentNotificaitonEvent', this.AgentNotificaitonEvent);
    }

    /**
     *
     * Triggered on notification reception
     * @param {AgentNotificaitonEvent} evt
     * @method
     */
    private AgentNotificaitonEvent = (evt: AgentNotificaitonEvent) => {
        // check if the interaction id is there then return
        if (evt.InteractionID > 0) {
            return;
        }

        // check the type
        if (evt.Type === 'Broadcast' && evt.Message) {
            this.broadcastMessage = evt.Message;
        }
    };

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------
}
