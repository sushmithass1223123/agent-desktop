import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { appAnimations } from '@modules/shared/animations/app.animation';
import { AgentSkillListComponent, MailboxSettingsComponent } from '@modules/shared/components';
import { TwComposeMessagingComponent } from '@modules/t-widgets/tw-collections/tw-compose-messaging/tw-compose-messaging.component';
import { AgentFeaturesService } from '@services/agent-features.service';
import { IAUXCodes, SDKClient } from '@tmac/sdk';
import { AGENT_FEATURES } from 'app/constants';
import { IWidget } from 'app/interfaces';
import { TwWidgetModel } from 'app/models';
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
    @Input() data: IWidget;

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

    constructor(private _matDialog: MatDialog, private _agentFeaturesService: AgentFeaturesService) {
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
                    panelClass: 'create-messaging-dialog',
                    width: '500px',
                    maxWidth: '100%',
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
                this._matDialog.open(AgentSkillListComponent, {
                    data: {
                        title: 'Make Call',
                        type: 'makeCall',
                        agent: {
                            allowed: true,
                            blind: false,
                            source: data.Data.Source,
                            allowedStates: data.Data.AllowedStates,
                            columns: data.Data.Columns,
                            teamFilter: data.Data.TeamFilter
                        },
                        skill: {
                            allowed: false,
                            blind: false,
                            columns: []
                        }
                    },
                    panelClass: 'agent-skill-dialog',
                    minWidth: '30%',
                    maxWidth: '100%',
                    height: '60%',
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
