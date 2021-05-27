import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { appAnimations } from '@modules/shared/animations/app.animation';
import { AgentSkillListComponent, CreateMessagingComponent, MailboxSettingsComponent } from '@modules/shared/components';
import { IAUXCodes, SDKClient } from '@tmac/sdk';
import { IWidget } from 'app/interfaces';

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
     * All channel list
     */
    channels: IChannel[];

    /**
     * Open list flag
     */
    openList: boolean;

    constructor(private _matDialog: MatDialog) { }

    /**
     * OnInit
     */
    ngOnInit(): void {
        // get the channels from config
        this.channels = this.data.Data.Channels;

        // check the agent features to enable/disable
        SDKClient.getAgentData().featuresList.forEach(f => {
            // get the featue
            const feature = f.Feature.toLowerCase();

            this.channels.forEach(c => {
                // get the subtype
                const subtype = c.SubType.toLowerCase();

                if (feature === 'isfaxoutenabled' && subtype === 'fax') {
                    c.Enabled = f.IsEnabled;
                }
                else if (feature === 'issmsoutenabled' && subtype === 'sms') {
                    c.Enabled = f.IsEnabled;
                }
                else if (feature === 'iswhatsappoutenabled' && subtype === 'whatsapp') {
                    c.Enabled = f.IsEnabled;
                }
                else if (feature === 'isemailoutenabled' && subtype === 'email') {
                    c.Enabled = f.IsEnabled;
                }
            });
        });

        // filter all enabled channels
        this.channels = this.channels.filter(c => c.Enabled);
    }

    /**
     * OnDestroy
     */
    ngOnDestroy(): void {
        this._matDialog.closeAll();
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
    addInteraction(channel: string, data: any): void {
        this.channels = [];
        switch (channel.toLowerCase()) {
            case 'text':
                this._matDialog.open(CreateMessagingComponent, {
                    panelClass: 'create-messaging-dialog',
                    data: data
                });
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
