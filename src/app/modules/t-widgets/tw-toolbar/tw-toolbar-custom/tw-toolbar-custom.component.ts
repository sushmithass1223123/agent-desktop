import { Component, OnInit, OnDestroy, Input, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils';
import { Subscription, timer } from 'rxjs';
import { SDKClient, AgentStatusChangeEvent } from '@tmac/sdk';
import { Subject } from 'rxjs';
import { intervalToDuration } from 'date-fns';
import { TMACEventService } from '@services/tmac-event.service';
import { MatDialogRef } from '@angular/material/dialog';
import { AppUiService } from '@services/app-ui.service';
import { AOTWidgetService } from '@services/aot-widget.service';
import { CustomTMACEventTypes, IPostMessage } from 'app/interfaces';
import { FuseConfig } from '@fuse/types';
import { TranslocoService } from '@ngneat/transloco';
import { setStringVars } from '@tmac/operators';
import { DomSanitizer } from '@angular/platform-browser';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { isEqual } from 'lodash';
import { UIActionEventService } from '@services/ui-action-event.service';
import { throwADError } from 'app/utils';
import { TwWidgetModel } from 'app/models';
import { AOTWidget, TwCustom } from '@ad/types';

/**
 * Aux timer component
 */
@Component({
    selector: 'tw-toolbar-custom',
    templateUrl: './tw-toolbar-custom.component.html',
    styleUrls: ['./tw-toolbar-custom.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwToolbarCustomComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * App config json data
     */
    @Input() data: any;
    /**
        * Fuse Config
        */
    // fuseConfig: FuseConfig;
    /**
     * Fuse custom config
     */
    customFuse$ = this._fuseFacadeService.getConfig({ colorTheme: 'colorTheme', webFont: 'webFont' });

    url: string;
    /**
     * Id and name of frame
     */
    idName: string;
    /**
         * Window pop widget
         */
    oinWidget: any;

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
     * Fuse config ref
     */
    fuseConfigRef: Partial<FuseConfig>;
    /**
        * Url loaded flag
        */
    loaded = false;

    constructor(
        private sanitizer: DomSanitizer,
        private _tmacEventService: TMACEventService,
        private _appUIService: AppUiService,
        private _aotWidgetService: AOTWidgetService,
        private translocoService: TranslocoService,
        private _fuseFacadeService: FuseFacadeService,
        private _uiActionEventService: UIActionEventService,

    ) {
        super('TwToolbarCustomComponent');
    }
    /**
        * Mat dialog ref
        */
    dialogRef: MatDialogRef<any, any>;
    /**
     * Lifecycle hook
     * @method
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);
        this.url = this.data.Data.Url;
        // listen to agent status change
        //SDKClient.events.on('AgentStatusChangeEvent', this.AgentStatusChangeEvent);
        // assign id
        this.idName = `tw_frame_${this.data.ID}`;

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
                        const events = this._tmacEventService.getAllEventsArray();
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
                    case 'gettmaccommands':
                        this.sendDataToWindow('onTMACCommand', this._tmacEventService.getTmacCommandsArray());
                        break;
                    case 'showcustompopup':
                        this.showCustomPopup(message.data);
                        break;
                    case 'emittmacevent':
                        this._tmacEventService.emitSDKEvent({
                            event: message.data,
                            log: true
                        })
                }
                this.logger.info('Message received from custom frame -' + message.name + ':' + JSON.stringify(message), true);
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
        this._uiActionEventService.onUIActionEvent().pipe(takeUntil(this.unsubscribeAll)).subscribe(data => {
            this.sendDataToWindow('onUIActionEvent', [data]);
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

    /**
     * Lifecycle hook
     * @method
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

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

        this._tmacEventService.addTMACEventListener([{
            label: 'OnTMACEvent',
            callback: (evts) => this.sendDataToWindow('onTMACEvent', evts)
        }]);

        // check if id is there to make sure loaded completely
        if (evt.currentTarget.id) {
            // set loaded to true
            setTimeout(() => {
                this.loaded = true;
            });
        }

        // can add a UI config here whether to send data or not
        this.sendDataToWindow('onTMACCommand', this._tmacEventService.getTmacCommandsArray());

        this.sendDataToWindow('onUIActionEvent', this._uiActionEventService.getUIEvents());
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
    processUIControlEvents(message: IPostMessage) {
        this._tmacEventService._uiControlsEvents.next(message.data);
    }   

    showCustomPopup(data: any) {
        // check if the url to be taken from param
        let url = data.url;

        // check if url is provided
        if (!url) {
            this._appUIService.showSnackbar(this.translocoService.translate('widgets.customDialog.urlNotFound'), 'failure');
            return;
        }

        // get assist widget config
        const title = `${data.title}`;
        const icon = data.icon || '';
        const actions = data.actions || ['destroy'];
        const viewState = data.viewState || 'restore';

        const width = data.width || 500;
        const height = data.Height || 500;

        // create a widget model
        const widget = new TwWidgetModel(title, 'tw-custom', icon);
        widget.InteractionDetails = this.data.InteractionDetails;
        widget.Config.Position.W = width;
        widget.Config.Position.H = height;
        widget.Config.Actions = actions;
        widget.Config.ViewState = viewState;
        widget.Data.Url = url;

        // if mandatory, pop a confiration and destroy
        if (data.confirmOnClose) {
            widget.OnDestroy = () => {
                // get confiration before close
                const confirmDialogRef = this._appUIService.showAppConfirmDialog('generic', this.translocoService.translate('widgets.agentAssist.confirmCloseTitle'), this.translocoService.translate('widgets.agentAssist.confirmCloseMsg'));
                confirmDialogRef.afterClosed().subscribe((resp) => {
                    if (resp) {
                        widget.destroy();
                    }
                });
                return false;
            };
        }

        // add to AOT widget service
        this._aotWidgetService.addWidget(widget as AOTWidget);
    }
}
