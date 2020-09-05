import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseConfigService } from '@fuse/services/config.service';
import { AppDataService } from '@services/app-data.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { takeUntil } from 'rxjs/operators';
import { SDKClient, GenericEvent } from 'tmac-sdk';
import { AotWidgetService } from '@services/aot-widget.service';
import { TwWidgetModel } from 'app/models';
import { IWidget } from 'app/interfaces';

@Component({
    selector: 'tw-agent-assist',
    templateUrl: './tw-agent-assist.component.html',
    styleUrls: ['./tw-agent-assist.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwAgentAssistComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    // holds all the data related to this widget from the config
    @Input() data: IWidget;

    ucid: string;

    widgetData: any;

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
        private _appDataService: AppDataService,
        private _aotWidgetService: AotWidgetService
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

        // assign the widget data
        this.widgetData = this.data.Data || new Object();

        // assign the UCID
        this.ucid = this.data?.InteractionDetails.UCID || '';

        // register to the event
        SDKClient.events.on('OnNLPDataEvent', this.OnNLPDataEvent);
    }

    /**
     * A callback method that performs 
     *  clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
        // de-register from the event
        SDKClient.events.off('OnNLPDataEvent', this.OnNLPDataEvent);
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    private OnNLPDataEvent = (evt?: GenericEvent): void => {
        const receivedData = evt;
        if (receivedData) {
            const parsedJson = JSON.parse(receivedData.JsonData);

            if (parsedJson.messageSource === 'agent') {
                return;
            }

            const parsedNlu = JSON.parse(parsedJson.nluResult);
            this.nlpCurrentData = { ...receivedData, JsonData: { ...parsedJson, nluResult: parsedNlu } };
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

    public openAssitWidget(intentItem: any): void {
        let url = this.widgetData.AssistWidgetUrl;

        // check if url is provided
        if (!url) {
            this._appDataService.showMessage('Assist widget URL not found!');
            return;
        }

        // get the intent name
        const intent = intentItem.name;
        const ucid = this.ucid;

        const mapObj = {
            '_intent': intent,
            '_ucid': ucid
        };

        const reg = new RegExp(Object.keys(mapObj).join('|'), 'gi');
        url = url.replace(reg, (matched: any) => {
            return mapObj[matched];
        });

        // get assist widget config
        const title = `${(this.widgetData.Title || 'Custom')} - ${intent}`;
        const icon = this.widgetData.Icon || '';
        const width = this.widgetData.Width || 500;
        const height = this.widgetData.Height || 500;
        const actions = this.widgetData.Actions || ['destroy'];
        const viewState = this.widgetData.ViewState || 'restore';

        // create a widget model
        const widget = new TwWidgetModel(title, 'tw-custom', icon);
        widget.Config.AOT = true;
        widget.Config.Position.W = width;
        widget.Config.Position.H = height;
        widget.Config.Actions = actions;
        widget.Config.ViewState = viewState;
        widget.Data.Url = url;

        // add to AOT widget service
        this._aotWidgetService.addWidget(widget);
    }
}

// for more info visit - https://angular.io/api/core
