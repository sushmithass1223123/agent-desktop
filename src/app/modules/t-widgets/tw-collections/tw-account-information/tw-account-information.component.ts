import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { AppUiService } from '@services/app-ui.service';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { IWidget } from 'app/interfaces';
import { GenericEvent, SDKClient } from '@tmac/sdk';

@Component({
    selector: 'tw-account-information',
    templateUrl: './tw-account-information.component.html',
    styleUrls: ['./tw-account-information.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwAccountInformationComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    /**
     * Holds all the data related to this widget from the config
     */
    @Input() data: IWidget;
    /**
     * Maximized flag
     */
    maximized = false;
    /**
     * Wireless data
     */
    wirelessData = [
        {
            data: [66, 34],
            labels: ['Download Sales', 'In-Store Sales', 'Mail-Order Sales'],
            options: {
                legend: { display: false },
                maintainAspectRatio: true,
                cutoutPercentage: 70,
                responsive: true
            },
            colors: [
                {
                    backgroundColor: ['rgba(196, 189, 231, 1)', 'lightgrey']
                }
            ]
        },
        {
            data: [50, 50],
            labels: ['Download Sales', 'In-Store Sales', 'Mail-Order Sales'],
            options: {
                legend: { display: false },
                maintainAspectRatio: true,
                cutoutPercentage: 70,
                responsive: true
            },
            colors: [
                {
                    backgroundColor: ['rgba(196, 189, 231, 1)', 'lightgrey']
                }
            ]
        }
    ];
    /**
     * To store current interaction Id
     */
    interactionId: number;
    /**
     * Customer authenticated flag
     */
    isAuthenticated: boolean;
    /**
     * NRIC of customer
     */
    NRIC = 'NA';
    /**
     * Caller ID of customer
     */
    CLI = 'NA';
    /**
     * Audio status of customer
     */
    audioStatus = '-';
    /**
     * Enroleld status for voice bio
     */
    enrolledStatus = 'NO';
    /**
     * Rejected flag
     */
    rejected: boolean;
    /**
     * Disable functions falg
     */
    disable: {
        /**
         * Update NRIC function
         */
        updateNRIC: boolean;
        /**
         * Enroll customer function
         */
        enroll: boolean;
        /**
         * Reject enrollment function
         */
        reject: boolean;
        /**
         * Assign third party function
         */
        thirdParty: boolean;
    };

    /**
     * Constructor
     * 
     * @param {AppUiService} _appUIService
     * @param {FuseProgressBarService} _fuseProgressBarService
     */
    constructor(
        private _appUIService: AppUiService,
        private _fuseProgressBarService: FuseProgressBarService
    ) {
        super();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * OnInit
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        this.isAuthenticated = this.data.Data.IsAuthenticated || false;
        this.interactionId = this.data.InteractionDetails?.InteractionID || 0;
        this.CLI = this.data.InteractionDetails?.PhoneNumber || 'NA';

        // set disabled to true first
        this.disable = {
            updateNRIC: false,
            enroll: true,
            reject: true,
            thirdParty: true
        };

        SDKClient.events.on('VBStatusEvent', this.VBStatusEvent);
    }

    /**
     * OnDestroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();

        SDKClient.events.off('VBStatusEvent', this.VBStatusEvent);
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------
    /**
     * To process VBStatusEvent
     * @param {GenericEvent} evt 
     */
    private VBStatusEvent = (evt: GenericEvent) => {
        // process the event
        // tslint:disable-next-line: radix
        const jsonData = parseInt(evt.JsonData);

        this.enrolledStatus = 'YES';

        if (jsonData < 50) {
            this.audioStatus = 'collecting';
        }
        else if (jsonData >= 50 && jsonData < 60) {
            this.audioStatus = 'enough';
            this.disable.reject = false;
            this.disable.thirdParty = false;
        }
        else {
            // show verified 
            this._appUIService.showSnackbar('Customer verified successfully');
            this.isAuthenticated = true;
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * To update voice bio NRIC
     */
    public updateVBNRIC(): void {
        this.disable.updateNRIC = true;
        const dialogRef = this._appUIService.showCustomDialog('prompt', 'Enter the NRIC', 'Update NRIC');
        dialogRef.afterClosed().subscribe((resp1) => {
            if (resp1) {
                this._fuseProgressBarService.show();
                SDKClient.externalConnectGenericCommand(
                    {
                        className: '',
                        functionName: 'UpdateNric',
                        moduleName: '',
                        parameters: [SDKClient.getAgentData().deviceId, this.interactionId, resp1]
                    }
                )
                    .then((resp2) => {
                        if (resp2.response === '1') {
                            this._appUIService.showSnackbar('NRIC updated successfully');
                            // update the NRIC
                            this.NRIC = resp1;
                        }
                        else {
                            this._appUIService.showSnackbar('NRIC update failed', 'failure');
                        }

                        this._fuseProgressBarService.hide();
                        this.disable.updateNRIC = false;
                    })
                    .catch(() => {
                        this.disable.updateNRIC = false;
                        this._fuseProgressBarService.hide();
                        this._appUIService.showSnackbar('Error in updating NRIC', 'failure');
                    });
            }
        });
    }

    /**
     * To enroll a customer
     */
    public enroll(): void {
        this._appUIService.showSnackbar('Customer enrolled successfully');
        this.disable.updateNRIC = true;
        this.disable.enroll = true;
        this.disable.reject = true;
        this.disable.thirdParty = true;
        this.enrolledStatus = 'YES';
    }

    /**
     * To reject the enrollment
     */
    public reject(): void {
        this._appUIService.showSnackbar('Enrollment rejected successfully');
        this.disable.updateNRIC = true;
        this.disable.enroll = true;
        this.disable.reject = true;
        this.disable.thirdParty = true;
    }

    /**
     * To assign third party
     */
    public thirdParty(): void {
        this._appUIService.showSnackbar('Third party assigned successfully');
        this.disable.updateNRIC = true;
        this.disable.enroll = true;
        this.disable.reject = true;
        this.disable.thirdParty = true;
    }
}

// for more info visit - https://angular.io/api/core
