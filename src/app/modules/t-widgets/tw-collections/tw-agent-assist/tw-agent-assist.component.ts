import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseConfigService } from '@fuse/services/config.service';
import { AppDataService } from '@services/app-data.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { takeUntil } from 'rxjs/operators';
import { SDKClient, GenericEvent } from 'tmac-sdk';

@Component({
    selector: 'tw-agent-assist',
    templateUrl: './tw-agent-assist.component.html',
    styleUrls: ['./tw-agent-assist.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwAgentAssistComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    // holds all the data related to this widget from the config
    @Input() data: any;

    eventData = {
        SubEventName: 'OnNLPDataEvent',
        JsonData:
            '{"eventName":"OnNLPDataEvent","speechResult":"","nluResult":"{\\"intent\\":{\\"name\\":\\"Complaint\\",\\"confidence\\":0.3467572524},\\"entities\\":[],\\"intent_ranking\\":[{\\"name\\":\\"Complaint\\",\\"confidence\\":0.3467572524},{\\"name\\":\\"Clarification\\",\\"confidence\\":0.3072097413},{\\"name\\":\\"mood_unhappy\\",\\"confidence\\":0.0942083595},{\\"name\\":\\"New_Connection\\",\\"confidence\\":0.0808563845},{\\"name\\":\\"goodbye\\",\\"confidence\\":0.0785963859},{\\"name\\":\\"mood_great\\",\\"confidence\\":0.0378756104},{\\"name\\":\\"affirm\\",\\"confidence\\":0.0241965965},{\\"name\\":\\"deny\\",\\"confidence\\":0.0213421076},{\\"name\\":\\"greet\\",\\"confidence\\":0.008957562}],\\"text\\":\\"hey i have a prolem with my internet and it is keep on disconncting. How many time i should approach you guys to check this issue ?\\"}","sentimentResult":"Negative","resonseType":0,"errorMessage":null,"ucid":"Livechat200827180940_1348","agentID":"1014"}',
        EventName: 'GenericTMACEvent',
        InteractionID: 0,
        IsInteractionConstructEvent: false,
        IsInteractionDisposeEvent: false,
        CreatedTime: '0001-01-01T00:00:00',
        EventId: null,
        RecoveryEvent: false,
        QueuedEvent: false,
        ACK: null
    };

    nlpCurrentData: any = null;

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store the fuse config for theme
    // -----------------------------------------------------------
    fuseConfig: any;

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store entire app config and get update
    // -----------------------------------------------------------
    appConfig: any;

    /**
     * Constructor
     * @param {FuseConfigService} _fuseConfigService
     * @param {AppDataService} _appDataService
     */
    constructor(
        // @ [OPTIONAL]
        private _fuseConfigService: FuseConfigService,
        // @ [OPTIONAL]
        private _appDataService: AppDataService
    ) {
        super();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * A callback method that is invoked immediately after the default change detector has checked the directive's data-bound properties for the first time,
     * and before any of the view or content children have been checked. It is invoked only once when the directive is instantiated.
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);
        // -----------------------------------------------------------
        // @ [OPTIONAL] to get the fuse config
        // -----------------------------------------------------------
        this._fuseConfigService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.fuseConfig = config;
        });

        // -----------------------------------------------------------
        // @ [OPTIONAL] to get the app config
        // -----------------------------------------------------------
        this._appDataService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.appConfig = config;
        });
        this.setupOnNLPDataEventListener();
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    private setupOnNLPDataEventListener(): void {
        this.handleOnNLPDataEvent();
        SDKClient.events.on('OnNLPDataEvent', this.handleOnNLPDataEvent);
    }

    private handleOnNLPDataEvent(evt?: GenericEvent): void {
        const receivedData = evt || this.eventData;
        if (receivedData) {
            const parsedJson = JSON.parse(receivedData.JsonData);
            const parsedNlu = JSON.parse(parsedJson.nluResult);
            this.nlpCurrentData = { ...receivedData, JsonData: { ...parsedJson, nluResult: parsedNlu } };
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------
}

// for more info visit - https://angular.io/api/core
