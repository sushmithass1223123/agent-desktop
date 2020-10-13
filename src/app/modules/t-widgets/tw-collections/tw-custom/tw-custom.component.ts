import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AOTWidgetService } from '@services/aot-widget.service';
import { TMACEventService } from '@services/tmac-event.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { AGENT_DATA_MAP } from 'app/constants';
import { IWidget } from 'app/interfaces';
import { IAgentData, IUIEvent, SDKClient } from 'tmac-sdk';

/**
 * TwCustomComponent
 */
@Component({
    selector: 'tw-custom',
    templateUrl: './tw-custom.component.html',
    styleUrls: ['./tw-custom.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwCustomComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * Holds all the data related to this widget from the config
     */
    @Input() data: IWidget;

    /**
     * Window pop widget
     */
    oinWidget: any;
    /**
     * Initial loaded flag
     */
    initialLoad: boolean;
    /**
     * Url loaded flag
     */
    loaded = false;
    /**
     * Custome frame URL
     */
    url: any;
    /**
     * Agent data
     */
    agentData: IAgentData;
    /**
     * Flag to show the UI or not
     */
    show: boolean;
    /**
     * If this widget is opened for an interaction
     */
    interactionId: number;

    constructor(
        private sanitizer: DomSanitizer,
        private _aotWidgetService: AOTWidgetService,
        private _tmacEventService: TMACEventService
    ) {
        super();
    }

    // tslint:disable-next-line: completed-docs
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // check if the url is provided
        if (this.data.Data.Url) {
            // get the url
            let url = this.data.Data.Url;

            // get the agent data map
            let mapObj = AGENT_DATA_MAP();

            // check if interaction details are there
            if (this.data.InteractionDetails) {
                this.interactionId = this.data.InteractionDetails.InteractionID;
                mapObj = { ...mapObj, ...this.data.InteractionDetails };
            }

            // check if extra map data sent with in an interaction
            if (this.data.Data.MapObject) {
                mapObj = { ...mapObj, ...this.data.Data.MapObject };
            }

            // add the query param
            const reg = new RegExp(Object.keys(mapObj).join('|'), 'gi');
            url = url.replace(reg, (matched: any) => {
                return mapObj[matched];
            });

            // check 'Open In New' widget
            if (this.data.Data.OpenInNew) {
                this.oinWidget = window.open(
                    url,
                    this.data.Name,
                    `menubar=no,resizable=yes,location=no,scrollbars=no,
                    width=${this.data.Config.Position.W || screen.width},
                    height=${this.data.Config.Position.H || screen.height}`
                );

                // listen to widget close event
                this.oinWidget.onunload = () => {
                    // destroy the widget
                    this._aotWidgetService.destroyWidget(this.data.ID);
                };

                return;
            }

            // load the iframe URL
            this.url = this.transform(url);

            // set show to true
            this.show = true;
        }

        // register to TMAC events
        SDKClient.events.on('onTMACEvent', this.onTMACEvent);
    }

    // tslint:disable-next-line: completed-docs
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        // de register from TMAC events
        SDKClient.events.off('onTMACEvent', this.onTMACEvent);
    }

    /**
     * To sanitize the URL to load URL safely
     * 
     * @param url Url to transform
     */
    transform(url: string): any {
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    /**
     * TMAC event listener function
     * @param evt TMAC event
     */
    private onTMACEvent = (evt: IUIEvent) => {
        this.sendEventsToWindow(evt);
    }

    /**
     * To send TMAC events to the iframe/popup window
     * 
     * @param event 
     */
    private sendEventsToWindow(evt: any): void {
        console.log(`${this.data.ID} - ${evt.EventName}`);

        const iframe = document.getElementById('frame_' + this.data.ID);
        // get the element
        const element = this.oinWidget ? this.oinWidget : iframe ? (iframe as HTMLIFrameElement).contentWindow : null;
        // check if the element is present
        if (element) {
            // send post message to the element
            element.postMessage({
                function: 'onTMACEvent',
                callback: null,
                data: evt,
                source: 'tmac',
                userObject: null
            }, '*');
        }
    }

    /**
     * Iframe loaded event
     */
    frameLoaded = () => {
        // check if this is not initial load
        if (this.initialLoad) {
            // set the loaded flag to true
            this.loaded = true;
            // send all interaction events to the frame/window
            if (this.interactionId) {
                const events = this._tmacEventService.get(this.interactionId);
                // loop and send all the interaction events to frame
                events?.forEach((item: any) => {
                    this.sendEventsToWindow(item);
                });
            }
        }
        else {
            // set initial load to true
            this.initialLoad = true;
        }
    }
}
