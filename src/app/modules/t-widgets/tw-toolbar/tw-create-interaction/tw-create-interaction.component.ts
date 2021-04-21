import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { widgetFabAnimations } from '@modules/shared/animations/widget-fab.animation';
import { AgentSkillListComponent, CreateMessagingComponent } from '@modules/shared/components';
import { IWidget } from 'app/interfaces';
import { IAUXCodes, SDKClient } from 'tmac-sdk';

/**
 * Create interaction
 */
@Component({
    selector: 'tw-create-interaction',
    templateUrl: './tw-create-interaction.component.html',
    styleUrls: ['./tw-create-interaction.component.scss'],
    animations: widgetFabAnimations,
    encapsulation: ViewEncapsulation.None
})
export class TwCreateInteractionComponent implements OnInit, OnDestroy {
    /**
     * Widget data
     */
    @Input() data: IWidget;

    constructor(
        private _matDialog: MatDialog
    ) { }

    /**
     * All channel list
     */
    channels = [];


    /**
     * OnInit
     */
    ngOnInit(): void {
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
        }
        else {
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
                            allowedStates: data.Data.AllowedState,
                            columns: data.Data.Columns
                        },
                        skill: {
                            allowed: false,
                            blind: false,
                            columns: data.Data.Columns
                        }
                    },
                    panelClass: 'agent-skill-dialog',
                    minWidth: '30%',
                    maxWidth: '100%',
                    height: '60%',
                    disableClose: true
                });
                break;
        }
    }
}
