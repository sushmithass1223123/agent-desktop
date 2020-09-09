import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils';
import { SDKClient, AgentNotificaitonEvent } from 'tmac-sdk';
import { AppUiService } from '@services/app-ui.service';

@Component({
    selector: 'tw-broadcast',
    templateUrl: './tw-broadcast.component.html',
    styleUrls: ['./tw-broadcast.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwBroadcastComponent extends TWidgetWrapper implements OnInit, OnDestroy {

    @Input() data: any;

    broadcastMessage: string;

    constructor(
        private _appUIService: AppUiService
    ) {
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
        else if (evt.Type.toLowerCase() === 'alert' && evt.Message) {
            this._appUIService.showAlertModal(evt.Message, 'error', 'Alert');
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------


}
