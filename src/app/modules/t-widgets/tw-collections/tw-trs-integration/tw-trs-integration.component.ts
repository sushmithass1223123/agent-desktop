import { TwTrsIntegration, TwTrsIntegrationData } from '@ad/types';
import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { AppUiService } from '@services/app-ui.service';
import { AgentStatusChangeEvent, CommandResultEvent, IResponse, SDKClient, SignalRWrapper, TUtils } from '@tmac/sdk';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';

/**
 * TRS Integration Component
 */
@Component({
    selector: 'tw-trs-integration',
    templateUrl: './tw-trs-integration.component.html',
    styleUrls: ['./tw-trs-integration.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwTrsIntegrationComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: TwTrsIntegration;

    /**
     * Widget config data
     */
    private WidgetData: TwTrsIntegrationData;

    /**
     * SignalR wrapper for TRS connection
     */
    private _signalrWrapper: SignalRWrapper;

    constructor(private _appUIService: AppUiService, private _fuseProgressBarService: FuseProgressBarService) {
        super('TwTrsIntegrationComponent');
    }

    /**
     * On Init
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // assign the data
        this.WidgetData = this.data.Data;

        // create a signalR wrapper
        this._signalrWrapper = new TUtils.SignalRWrapper(this.WidgetData.Urls, '', 'TRS', {}, 'CustomApplicationHub');

        // register to hub events
        this.registerHubEvents();

        // connect to the server
        this._signalrWrapper.connect();
    }

    /**
     * On Destroy.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * To register hub events
     */
    private registerHubEvents(): void {
        /**
         * To show alert
         *
         * @param {String} message message to be displayed in tmac ui
         * @param {'Info' | 'Success' | 'Warning' | 'Error'} type red/green/orange/blue
         */
        this._signalrWrapper.hub.on('ShowAlertMessage', (message: string, type: 'Info' | 'Success' | 'Warning' | 'Error') => {
            this._appUIService.showAppSnackbar({
                message,
                state: type === 'Error' ? 'danger' : (type.toLowerCase() as 'info' | 'success' | 'warning' | 'danger')
            });
        });

        /**
         * To change agent status
         *
         * @param {String}statusName status name to change
         * @param {String} statusCode status code to change
         */
        this._signalrWrapper.hub.on('ChangeStatus', (statusName: string, statusCode: string) => {
            // show the progress bar
            this._fuseProgressBarService.show();

            // change the status
            SDKClient.changeStatus({
                type: statusName.toLocaleLowerCase() === 'available' ? 'available' : statusName.toLocaleLowerCase() === 'acw' ? 'acw' : 'aux',
                code: statusCode
            })
                .then((dt: IResponse) => {
                    // get the response
                    let result: AgentStatusChangeEvent | CommandResultEvent = dt.response;
                    // check the response
                    if (result.ResultCode === 1) {
                        // parse the result to AgentStatusChangeEvent
                        result = result as AgentStatusChangeEvent;
                        // make call success
                        this._appUIService.showSnackbar(`TRS changed status to ${result.Status} successfully`);
                    }
                })
                .finally(() => {
                    // hide the progress bar
                    this._fuseProgressBarService.hide();
                });
        });

        /**
         * To execute action
         *
         * @param {any} data action data json string
         */
        this._signalrWrapper.hub.on('NewAction', (data: any) => {
            const action = JSON.parse(data);
            if (action.ActionName) {
                if (typeof this[action.ActionName] === 'function') {
                    this[action.ActionName](action);
                }
            }
        });
    }

    /**
     * Action to transfer call to another agent
     *
     * @param data
     */
    private transferCall(data: any): void {}

    /**
     * Action to change status of agent
     *
     * @param data
     */
    private changeStatus(data: {
        /**
         * New state to change
         */
        state: string;
    }): void {}

    /**
     * Action to warn the agent
     *
     * @param data
     */
    private warning(data: any): void {}

    /**
     * Action to logoff agent from AD
     *
     * @param data
     */
    private logOff(data: any): void {}
    /**
     * Action to get supervisor approval
     *
     * @param data
     */
    private getSupervisorApproval(data: any): void {}

    /**
     * Action to get release blackout confirmation
     *
     * @param data
     */
    private getReleaseBlackOutConfirmation(data: any): void {}
}
