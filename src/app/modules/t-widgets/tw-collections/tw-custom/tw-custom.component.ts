import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { AOTWidgetService } from '@services/aot-widget.service';
import { TMACEventService } from '@services/tmac-event.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { AGENT_DATA_MAP } from 'app/constants';
import { IWidget } from 'app/interfaces';
import { Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { getStringVars, setStringVars } from '@tmac/operators';
import { IUIEvent, SDKClient } from 'tmac-sdk';
import { get, join } from 'lodash';
import { formatJsonData } from 'app/utils';

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
     * Fuse Config
     */
    fuseConfig: FuseConfig;

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
     * Flag to show the UI or not
     */
    show: boolean;
    /**
     * If this widget is opened for an interaction
     */
    interactionId: number;

    /**
     * subscriptions
     */
    subscriptions: Partial<{
        /**
         * Events by Id
         */
        eventsById: Subscription;
        /**
         * All events
         */
        allEvents: Subscription;
    }>;

    constructor(
        private sanitizer: DomSanitizer,
        private _aotWidgetService: AOTWidgetService,
        private _tmacEventService: TMACEventService,
        private _fuseConfigService: FuseConfigService
    ) {
        super();
    }

    // tslint:disable-next-line: completed-docs
    ngOnInit(): void {
        this.subscriptions = {};
        // call the wrapper init method
        this.initWrapper(this.data);

        // Subscribe to the config changes
        this._fuseConfigService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((fuseConfig: FuseConfig) => {
            this.fuseConfig = fuseConfig;
        });

        // check if the url is provided
        if (this.data.Data.Url) {
            // get the url
            let url = this.data.Data.Url;

            // // get the agent data map
            // let mapObj = AGENT_DATA_MAP();

            // // check if interaction details are there
            // if (this.data.InteractionDetails) {
            //     this.interactionId = this.data.InteractionDetails.InteractionID;
            //     mapObj = { ...mapObj, ...this.data.InteractionDetails };
            // }

            // // check if extra map data sent with in an interaction
            // if (this.data.Data.MapObject) {
            //     mapObj = { ...mapObj, ...this.data.Data.MapObject };
            // }

            // // add the query param
            // const reg = new RegExp(Object.keys(mapObj).join('|'), 'gi');
            // url = url.replace(reg, (matched: any) => {
            //     return mapObj[matched] || matched;
            // });

            // const AgentData = AGENT_DATA_MAP('LowerCase');
            const setJson = setStringVars(url, { AgentData: SDKClient.getAgentData() });

            // const setJson = {};

            // if (stringVals && stringVals.length) {
            //     stringVals.forEach((val) => {
            //         // get the path by taking string between ()
            //         const path = val.substring(val.lastIndexOf('${') + 2, val.lastIndexOf('}'));
            //         const splitPath = path.split('.');

            //         const vals = formatJsonData(
            //             {
            //                 AgentData: this.FindInAgentData(splitPath) ?? '',
            //                 TmacEvent: this.data.InteractionDetails
            //             },
            //             splitPath.reduce((acc, curr) => {
            //                 acc[curr] = curr.split('.');
            //                 return acc;
            //             }, {})
            //         );

            //         if (splitPath[0].toLowerCase() === 'agentdata') {
            //             setJson[path] = this.FindInAgentData(splitPath) ?? '';
            //         } else if (this.data.InteractionDetails && splitPath[0].toLowerCase() === 'tmacevent') {
            //             setJson[path] = this.FindInTMACEvent(splitPath, this.data.InteractionDetails) ?? '';
            //         }
            //     });

            //     // check if json has data
            //     if (Object.keys(setJson).length) {
            //         url = setStringVars(url, setJson);
            //     }
            // }

            // check 'Open In New' widget
            if (this.data.Data.OpenInNew) {
                this.oinWidget = window.open(
                    url,
                    this.data.Name,
                    `menubar=no,resizable=yes,location=no,scrollbars=no,
                    width=${this.data.Config.Position.W || screen.width},
                    height=${this.data.Config.Position.H || screen.height}`
                );

                try {
                    if (this.oinWidget) {
                        // listen to widget close event
                        this.oinWidget.onunload = () => {
                            // destroy the widget
                            this._aotWidgetService.destroyWidget(this.data.ID);
                        };
                    }
                } catch (error) {
                    console.error(error);
                }

                return;
            }

            // load the iframe URL
            this.url = this.transform(url);

            // set show to true
            this.show = true;

            // check if auto refresh is enabled
            if (this.data.Data.AutoRefresh && Number(this.data.Data.AutoRefresh) > 0) {
                setInterval(() => {
                    this.onRefreshEvent();
                }, Number(this.data.Data.AutoRefresh) * 1000);
            }
        }
    }

    /**
     * On Destroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * To find value from TMAC events based on object map
     *
     * @param {string[]} splitParam
     * @param {IUIEvent} evt
     */
    private FindInTMACEvent(splitParam: string[], evt: IUIEvent): string {
        let getValue = '';
        // shift the first item out i.e., keyword TMACEvent
        splitParam.shift();
        // get all the interaction events and process the events and form params for action
        this._tmacEventService.interactionEvents(evt.InteractionID).forEach((ev: IUIEvent) => {
            if (splitParam[0] === ev.EventName) {
                // shift the first item out i.e., EventName
                splitParam.shift();
                // map the property and get the value from event property
                const valueMap = join(splitParam, '.');
                // map the property and get the value from event property=
                getValue = get(ev, valueMap, '');
            }
        });
        return getValue;
    }

    /**
     * To find value from Agent Data
     *
     * @param splitParam
     */
    private FindInAgentData(splitParam: string[]): any {
        // get the agent data map
        const mapObj = AGENT_DATA_MAP('LowerCase');
        // add the query param
        const reg = new RegExp(Object.keys(mapObj).join('|'), 'gi');
        return splitParam[1].replace(reg, (matched: string) => {
            return mapObj[matched.toLowerCase()] || '';
        });
    }

    /**
     * To sanitize the URL to load URL safely
     *
     * @param url Url to transform
     */
    transform(url: string): any {
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    // /**
    //  * TMAC event listener function
    //  * @param evt TMAC event
    //  */
    // private onTMACEvent = (evt: IUIEvent) => {
    //     this.sendEventsToWindow([evt]);
    // }

    /**
     * To send TMAC events to the iframe/popup window
     *
     * @param {any[]} events
     */
    private sendEventsToWindow(evts: any[]): void {
        const iframe = document.getElementById('frame_' + this.data.ID);
        // get the element
        const element = this.oinWidget ? this.oinWidget : iframe ? (iframe as HTMLIFrameElement).contentWindow : null;
        // check if the element is present
        if (element) {
            // send post message to the element
            element.postMessage(
                {
                    function: 'onTMACEvent',
                    callback: null,
                    data: evts,
                    source: 'tmac',
                    userObject: null
                },
                '*'
            );
        }
    }

    /**
     * Iframe loaded event
     */
    frameLoaded = () => {
        // check if this is not initial load
        // if (this.initialLoad) {
        if (!this.subscriptions.eventsById && !this.subscriptions.allEvents) {
            // subscribe to interaction events
            this.subscriptions.eventsById = this._tmacEventService
                .getInteractionEventsById(this.interactionId)
                .pipe(takeUntil(this.unsubscribeAll))
                .subscribe((evts) => this.sendEventsToWindow(evts));

            // subscribe to all non interaction events
            this.subscriptions.allEvents = this._tmacEventService
                .getAllEvents()
                .pipe(takeUntil(this.unsubscribeAll))
                .subscribe((evts) => this.sendEventsToWindow(evts));
        }

        // set loaded to true
        setTimeout(() => {
            this.loaded = true;
        });
        // } else {
        //     // set initial load to true
        //     this.initialLoad = true;
        // }
    };

    /**
     * On refresh event
     */
    onRefreshEvent(): void {
        const urlRef = this.url;
        this.url = null;
        this.initialLoad = false;
        this.loaded = false;
        setTimeout(
            (x) => {
                this.url = x;
            },
            0,
            urlRef
        );
    }
}
