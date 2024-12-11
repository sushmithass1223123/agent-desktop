import { AgentSkillListData, TwCreateInteraction } from '@ad/types';
import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { appAnimations } from '@modules/shared/animations/app.animation';
import { AgentSkillListComponent, MailboxSettingsComponent } from '@modules/shared/components';
import { TwComposeMessagingComponent } from '@modules/t-widgets/tw-collections/tw-compose-messaging/tw-compose-messaging.component';
import { AgentFeaturesService } from '@services/agent-features.service';
import { TMACEventService } from '@services/tmac-event.service';
import { IAUXCodes, SDKClient } from '@tmac/sdk';
import { AGENT_FEATURES } from 'app/constants';
import { AgentSkillListDataModel, TwWidgetModel } from 'app/models';
import { merge } from 'lodash';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Create interaction
 */
@Component({
    selector: 'tw-create-interaction',
    templateUrl: './tw-create-interaction.component.html',
    styleUrls: ['./tw-create-interaction.component.scss'],
    animations: appAnimations,
    encapsulation: ViewEncapsulation.None
})
export class TwCreateInteractionComponent implements OnInit, OnDestroy {
    /**
     * Widget data
     */
    @Input() data: TwCreateInteraction;

    /**
     * Subject to unsubscribe
     */
    private _unsubscribeAll: Subject<any>;

    /**
     * Filter channel list
     */
    channels: IChannel[];

    /**
     * All channel list
     */
    originalChannels: IChannel[];

    /**
     * Open list flag
     */
    openList: boolean;

    constructor(
        private _matDialog: MatDialog,
        private _agentFeaturesService: AgentFeaturesService,
        private _tmacEventService: TMACEventService
    ) {
        // set the unsubscribeAll defaults
        this._unsubscribeAll = new Subject();
    }

    /**
     * OnInit
     */
    ngOnInit(): void {
        // get the channels from config
        this.originalChannels = this.channels = this.data.Data.Channels;

        this._agentFeaturesService.features.pipe(takeUntil(this._unsubscribeAll)).subscribe((change: boolean) => {
            if (change) {
                // check agent features
                this.checkAgentFeatures();
            }
        });

        this._tmacEventService.getUIControlEvents
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(this.handleUIControls.bind(this));

        // check agent features
        this.checkAgentFeatures();
    }

    /**
     * OnDestroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
        this._matDialog.closeAll();
    }

    /**
     * Method to handle UI events
     * @param data event data
     */
    private handleUIControls(data: { eventName: string }): void {
        try {
            if (!data || !data?.eventName) return;

            switch (data.eventName) {
                case 'enableMakeCall':
                    this.channels.forEach((channel) => {
                        if (channel.Type === 'voice') channel.Enabled = true;
                    });
                    break;
                case 'disableMakeCall':
                    this.channels.forEach((channel) => {
                        if (channel.Type === 'voice') channel.Enabled = false;
                    });
                    break;
                default:
                    console.log(`[TwCreateInteraction.handleUIControls] - ${data.eventName} is not handled`);
                    break;
            }
        } catch (ex) {
            console.error(
                `[TwCreateInteraction.handleUIControls] - Error occured while handling ${data.eventName} event`,
                ex
            );
        }
    }

    /**
     * To check agent features
     */
    private checkAgentFeatures(): void {
        // check the agent features to enable/disable
        SDKClient.getAgentData().featuresList.forEach((f) => {
            // get the featue
            const feature = f.Feature.toLowerCase();
            this.originalChannels.forEach((c) => {
                // get the subtype
                const subtype = c.SubType.toLowerCase();
                if (feature === AGENT_FEATURES.IsFaxOutEnabled && subtype === 'fax') {
                    c.Enabled = f.IsEnabled;
                } else if (feature === AGENT_FEATURES.IsSMSOutEnabled && subtype === 'sms') {
                    c.Enabled = f.IsEnabled;
                } else if (feature === AGENT_FEATURES.IsWhatsAppOutEnabled && subtype === 'whatsapp') {
                    c.Enabled = f.IsEnabled;
                } else if (feature === AGENT_FEATURES.IsEmailOutEnabled && subtype === 'email') {
                    c.Enabled = f.IsEnabled;
                }
            });
        });
        this.channels = this.originalChannels.filter((c) => c.Enabled);
    }

    /**
     * Check if the agent can do action based on EnableState
     *
     * @param code
     */
    checkAux(code: string): boolean {
        // check if EnableState is provided, if not return true
        if (!code) {
            return true;
        }

        // get the logout code from aux codes list
        const auxItem: IAUXCodes = SDKClient.getAgentData().auxCodes.filter((a: IAUXCodes) => a.Name === SDKClient.getAgentData().agentStatus)?.[0];

        // check if the logout aux matches
        if (auxItem?.Code === code) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * To create an outgoing interaction
     *
     * @param channel
     * @param data
     */
    addInteraction(channel: string, data: IChannel): void {
        this.openList = false;
        switch (channel.toLowerCase()) {
            case 'text':
                const dialogRef = this._matDialog.open(TwComposeMessagingComponent, {
                    panelClass: ['create-messaging-dialog', 'twd-max-w-11/12'],
                    width: '500px',
                    height: '350px',
                    disableClose: true
                });

                const widget = new TwWidgetModel(data.Name, 'tw-compose-messaging', data.Icon);
                widget.Config.Actions = ['destroy'];
                widget.Data.Type = data.SubType;
                widget.destroy = () => {
                    dialogRef.close();
                };

                dialogRef.componentInstance.data = widget;
                break;

            case 'voice':
                let config = data.Data;

                // config = {
                //     title: 'Make Call',
                //     type: 'makeCall',
                //     ...config,
                //     skill: {
                //         allowed: false,
                //         blind: false,
                //         columns: []
                //     }
                // };

                // if (config.SpeedDial) {
                //     config = {
                //         agent: {
                //             allowed: true,
                //             consult: true,
                //             source: config.Agent.Source,
                //             allowedStates: config.Agent.AllowedStates,
                //             columns: config.Agent.Columns,
                //             teamFilter: config.Agent.TeamFilter
                //         },
                //         speedDial: {
                //             allowed: config.SpeedDial?.Allowed,
                //             consult: config.SpeedDial?.Consult,
                //             blind: config.SpeedDial?.Blind,
                //             comments: config.SpeedDial?.Comments,
                //             source: config.SpeedDial?.Source,
                //             teamFilter: config.SpeedDial?.TeamFilter,
                //             columns: config.SpeedDial?.Columns
                //         }
                //     };
                // } else {
                //     config = {
                //         agent: {
                //             allowed: true,
                //             consult: true,
                //             source: config.Source,
                //             allowedStates: config.AllowedStates,
                //             columns: config.Columns,
                //             teamFilter: config.TeamFilter
                //         }
                //     };
                // }

                let dialogData: AgentSkillListData = new AgentSkillListDataModel('makeCall', 'Make Call');

                // set agent configs to true which is not available in "data.Data" section
                dialogData.Agent = {
                    ...dialogData.Agent,
                    Allowed: true,
                    Consult: true
                };

                // for the backward compatibility
                // SpeedDial was added in the version 5.0.8.30, until then "data.Data" was having what's needed for the Agent config
                // so check if the "data.Data" has SpeedDial then merge with entire data
                // else change only the Agent data which is in the else condition
                if (config.SpeedDial) {
                    dialogData = merge({}, dialogData, config);
                } else {
                    dialogData.Agent = merge({}, dialogData.Agent, config);
                }

                this._matDialog.open(AgentSkillListComponent, {
                    data: dialogData,
                    panelClass: [
                        'agent-skill-dialog',
                        'twd-w-11/12',
                        'twd-h-10/12',
                        'lg:twd-w-7/12',
                        'lg:twd-h-8/12',
                        'xl:twd-w-6/12',
                        '2xl:twd-w-5/12'
                    ],
                    minWidth: '30%',
                    maxWidth: '100%',
                    disableClose: true
                });
                break;

            case 'email':
                const ref = this._matDialog.open(MailboxSettingsComponent, {
                    minWidth: '30%',
                    data: {
                        close: () => ref.close()
                    }
                });
                break;
        }
    }
}

interface IChannel {
    /**
     * Channel name
     */
    Name: string;
    /**
     * Channel enabled flag
     */
    Enabled: boolean;
    /**
     * Channel enable state
     */
    EnableState: string;
    /**
     * Type of channel
     */
    Type: string;
    /**
     * Subtype of channel
     */
    SubType: string;
    /**
     * Icon for the channel
     */
    Icon: string;
    /**
     * Data for the channel
     */
    Data: any;
}
