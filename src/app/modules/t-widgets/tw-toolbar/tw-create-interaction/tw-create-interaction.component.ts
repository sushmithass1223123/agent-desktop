import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { widgetFabAnimations } from '@modules/shared/animations/widget-fab.animation';
import { AgentSkillListComponent, CreateMessagingComponent } from '@modules/shared/components';
import { IWidget } from 'app/interfaces';

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
                            allowedStates: data.Data.AllowedState
                        },
                        skill: {
                            allowed: false,
                            blind: false
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
