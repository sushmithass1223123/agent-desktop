import { TwCustom } from '@ad/types';
import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { FuseConfig } from '@fuse/types';
import { AOTWidgetService } from '@services/aot-widget.service';
import { AppUiService } from '@services/app-ui.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { TMACEventService } from '@services/tmac-event.service';
import { setStringVars } from '@tmac/operators';
import { SDKClient } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { EXCLUDED_TMAC_EVENT } from 'app/constants';
import { CustomTMACEventTypes, IPostMessage } from 'app/interfaces';
import { throwADError } from 'app/utils';
import { isEqual } from 'lodash';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';

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
    @Input() data: TwCustom;

    /**
     * Fuse Config
     */
    // fuseConfig: FuseConfig;
    /**
     * Fuse custom config
     */
    customFuse$ = this._fuseFacadeService.getConfig({ colorTheme: 'colorTheme', webFont: 'webFont' });
    /**
     * Window pop widget
     */
    oinWidget: any;
    /**
     * Url loaded flag
     */
    loaded = false;
    /**
     * Custome frame URL
     */
    url: any;
    /**
     * Id and name of frame
     */
    idName: string;
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

    /**
     * Excluded events to emit
     */
    excludedEvents: CustomTMACEventTypes[];

    /**
     * Mat dialog ref
     */
    dialogRef: MatDialogRef<any, any>;

    /**
     * Fuse config ref
     */
    fuseConfigRef: Partial<FuseConfig>;

    constructor(
        private sanitizer: DomSanitizer,
        private _aotWidgetService: AOTWidgetService,
        private _tmacEventService: TMACEventService,
        private _fuseFacadeService: FuseFacadeService,
        private _appUIService: AppUiService
    ) {
        super('TwCustomComponent');

        this.excludedEvents = EXCLUDED_TMAC_EVENT as CustomTMACEventTypes[];
    }

    // tslint:disable-next-line: completed-docs
    ngOnInit(): void {
        this.subscriptions = {};
        // call the wrapper init method
        this.initWrapper(this.data);

        // assign id
        this.idName = `tw_frame_${this.data.ID}`;

        // check if this is opened in an interaction
        if (this.data.InteractionDetails) {
            this.interactionId = this.data.InteractionDetails.InteractionID;
        }

        // register to post message subject
        this._tmacEventService.postMessage.pipe(takeUntil(this.unsubscribeAll)).subscribe(async (message: IPostMessage) => {
            try {
                const fn = message.function?.toLowerCase();
                // check the message from frame
                if (message.name && message.name !== this.idName) {
                    // ignore message from different id
                    return;
                }
                switch (fn) {
                    case 'gettmacevents':
                        const events = this._tmacEventService.getAllEventsArrayExcluded(this.excludedEvents, this.interactionId);
                        // check event are there
                        if (events.length) {
                            // send events to the child
                            this.sendDataToWindow(message.callback || 'onTMACEvent', events, message.userObject);
                        }
                        break;
                    case 'showconfirmdialog':
                        this.dialogRef = this._appUIService.showAppConfirmDialog('generic', message.data?.title, message.data?.message);
                        this.dialogRef.afterClosed().subscribe((dialogResult: boolean) => {
                            this.sendDataToWindow(message.callback || 'onConfirmClosed', dialogResult, message.userObject);
                        });
                        break;
                    case 'closeconfirmdialog':
                        this.dialogRef?.close();
                        break;
                    case 'invokesdk':
                        if (!message.data?.method) {
                            return;
                        }
                        const method = message.data?.method;
                        const params = message.data?.params;
                        // invoke SDK method dynamically
                        const response = await SDKClient[method](...params);
                        // send the response to the child
                        this.sendDataToWindow(message.callback || `${method}Done`, response, message.userObject);
                        break;
                    case 'destroywidget':
                        // destroy the widget
                        this._aotWidgetService.destroyWidget(this.data.ID);
                        break;
                    case 'getthemeconfig':
                        this.sendDataToWindow(message.callback || 'onThemeChange', this.fuseConfigRef, message.userObject);
                        break;
                    case 'uicontrolevents':
                        this.processUIControlEvents(message);
                        break;
                    case 'notificationmessage': 
                        this._appUIService.showSnackbar(message.data?.message, message.data?.type);
                        break;
                    case 'getagentdata':
                        this.sendDataToWindow(message.callback, SDKClient.getAgentData(), message.userObject);
                        break;
                }
                this.logger.info('Message received from custom frame -' + message.name + ':'+ JSON.stringify(message),true);
            } catch (error) {
                this.logger.error('Error in TwCustomComponent.postMessage', error, false);
            }
        });

        // check if the url is provided
        if (this.data.Data.Url) {
            const url = setStringVars(this.data.Data.Url, {
                AgentData: SDKClient.getAgentData(),
                Interaction: this.data.InteractionDetails
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

        this.customFuse$
            .pipe(
                takeUntil(this.unsubscribeAll),
                distinctUntilChanged((p, c) => isEqual(p, c))
            )
            .subscribe((config) => {
                this.fuseConfigRef = config;
                this.sendDataToWindow('onThemeChange', config);
            });
    }

    /**
     * On Destroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
        this.dialogRef?.close();
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
     * To send data to the iframe/popup window
     *
     * @param {String} fn
     * @param {Any} data
     * @param {Any} userObject
     */
    private sendDataToWindow(fn: string, data: any, userObject?: any): void {
        try {
            const iframe = document.getElementById('tw_frame_' + this.data.ID);
            // get the element
            const element = this.oinWidget ? this.oinWidget : iframe ? (iframe as HTMLIFrameElement).contentWindow : null;
            // check if the element is present
            if (element) {
                // send post message to the element
                element.postMessage(
                    {
                        function: fn,
                        callback: null,
                        data,
                        source: 'tmac',
                        userObject
                    },
                    '*'
                );
            }
        } catch (error) {
            throwADError('Error in TwCustomComponent', error);
        }
    }

    /**
     * Iframe loaded event
     */
    frameLoaded = (evt: any) => {
        if (!this.subscriptions.eventsById && !this.subscriptions.allEvents) {
            // subscribe to interaction events
            if (this.interactionId) {
                this.subscriptions.eventsById = this._tmacEventService
                    .getInteractionEventsById(this.interactionId)
                    .pipe(takeUntil(this.unsubscribeAll))
                    .subscribe((evts) => this.sendDataToWindow('onTMACEvent', evts));
            }

            // subscribe to all non interaction events
            this.subscriptions.allEvents = this._tmacEventService
                .getNonInteractionEventsExcluded(this.excludedEvents)
                .pipe(takeUntil(this.unsubscribeAll))
                .subscribe((evts) => this.sendDataToWindow('onTMACEvent', evts));
        }

        // check if id is there to make sure loaded completely
        if (evt.currentTarget.id) {
            // set loaded to true
            setTimeout(() => {
                this.loaded = true;
            });
        }
    };

    /**
     * On refresh event
     */
    onRefreshEvent(): void {
        const urlRef = this.url;
        this.url = null;
        this.loaded = false;
        setTimeout(
            (x) => {
                this.url = x;
            },
            0,
            urlRef
        );
    }

    processUIControlEvents(message:IPostMessage) {
        this._tmacEventService._uiControlsEvents.next(message.data);
    }
}
