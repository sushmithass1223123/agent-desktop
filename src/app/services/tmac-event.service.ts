import { Injectable } from '@angular/core';
import { IWidget } from 'app/interfaces';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AgentNotificaitonEvent, IUIEvent, SDKClient, TUtils } from 'tmac-sdk';
import { AOTWidgetService } from './aot-widget.service';
import { AppDataService } from './app-data.service';
import { AppUiService } from './app-ui.service';
import { InteractionManagerService } from './interaction-manager.service';

@Injectable({
    providedIn: 'root'
})
export class TMACEventService {
    // Private
    private _unsubscribeAll: Subject<any>;
    private _tmacEventArray: any[];
    private _constructDisposeEventSubject: BehaviorSubject<any>;
    private _aotWidgets: IWidget[];

    constructor(
        private _appDataService: AppDataService,
        private _interactionManagerService: InteractionManagerService,
        private _appUIService: AppUiService,
        private _aotWidgetService: AOTWidgetService
    ) {
        // intialize all the subject
        this._unsubscribeAll = new Subject();
        this._constructDisposeEventSubject = new BehaviorSubject({});
        this._tmacEventArray = new Array();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * getter for interaction construct/dispose events
     */
    get constructDisposeEvents(): any | Observable<any[]> {
        return this._constructDisposeEventSubject.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private Methods
    // -----------------------------------------------------------------------------------------------------    

    private onTMACEvents = (evt: IUIEvent) => {
        if (evt.InteractionID > 0) {
            // add all the interaction events to the array
            this._tmacEventArray.push(evt);
            // check for construct/dispose events
            if (evt.IsInteractionConstructEvent || evt.IsInteractionDisposeEvent) {
                // for dispose event remove the reference from array
                if (evt.IsInteractionDisposeEvent) {
                    // remove the events for the ID
                    this.remove(evt.InteractionID);
                    // remove the interaction reference 
                    this._interactionManagerService.removeInteraction(evt.InteractionID);
                }
                // notify the observers
                this._constructDisposeEventSubject.next(evt);
            }
        }
    }

    private remove(interactionId: number): void {
        this._tmacEventArray = this._tmacEventArray.filter(i => i.InteractionID !== interactionId);
    }

    private onAgentNotificaitonEvent = (evt: AgentNotificaitonEvent) => {
        // get the type
        const type = evt.Type.toLowerCase();
        // handle alerts
        if (type === 'alert' && evt.Message) {
            this._appUIService.showAlertModal(evt.Message, 'error', 'Alert');
        }
        else if (type === 'executeaction') {
            // parse the action
            const parsedMessage: { Action: string, Data: string } = JSON.parse(evt.Message);
            // get the action
            switch (parsedMessage.Action.toLowerCase()) {
                case 'registercallback':
                    // check if AOT cofngured for register callback
                    const widget = this._aotWidgets.filter((w: IWidget) => w.Type === 'tw-register-callback')?.[0];
                    // check if widget is found
                    if (widget) {
                        this._aotWidgetService.addWidget(widget);
                        // listen to on destroy event
                        // widget.OnDestroy = () => {
                        //     SDKClient.updateAgentReminder({
                        //     });
                        // };
                    }
                    break;
                default:
            }
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public Methods
    // -----------------------------------------------------------------------------------------------------

    public subscribe(): void {
        TUtils.Logger.console('info', 'TMACEventService.subscribe');

        // subscribe to app config
        this._appDataService.config
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(
                (config: any) => {
                    // get the AOT widgets
                    this._aotWidgets = config.Main.AOT.Widgets;
                }
            );

        SDKClient.events.on('onTMACEvent', this.onTMACEvents);
        SDKClient.events.on('AgentNotificaitonEvent', this.onAgentNotificaitonEvent);
    }

    public unsubscribe(): void {
        TUtils.Logger.console('info', 'TMACEventService.unsubscribe');

        SDKClient.events.off('onTMACEvent', this.onTMACEvents);
        SDKClient.events.off('AgentNotificaitonEvent', this.onAgentNotificaitonEvent);

        // unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    public get(interactionId: number): any {
        // get the events based on interaction Id
        const events = this._tmacEventArray.filter(i => i.InteractionID === interactionId);
        if (events.length > 0) {
            return events;
        }
        return [];
    }
}
