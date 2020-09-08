import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils';
import { SDKClient, AgentNotificaitonEvent } from 'tmac-sdk';

@Component({
    selector: 'tw-broadcast',
    templateUrl: './tw-broadcast.component.html',
    styleUrls: ['./tw-broadcast.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwBroadcastComponent extends TWidgetWrapper implements OnInit, OnDestroy {

    @Input() data: any;

    broadcastMessage: string;

    constructor() {
        super();
    }

    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // register to event
        SDKClient.events.on('AgentNotificaitonEvent', this.AgentNotificaitonEvent);
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        // unregister from event
        SDKClient.events.off('AgentNotificaitonEvent', this.AgentNotificaitonEvent);
    }

    private AgentNotificaitonEvent = (evt: AgentNotificaitonEvent) => {
        // check the type
        if (evt.Type === 'Broadcast' && evt.Message) {
            this.broadcastMessage = evt.Message;
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------


}
