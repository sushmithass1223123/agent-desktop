import { Component, Input, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { widgetFabAnimations } from '@modules/shared/animations/widget-fab.animation';
import { CreateSmsComponent } from '@modules/shared/create-sms/create-sms.component';
import { IWidget } from 'app/interfaces';

@Component({
    selector: 'tw-create-interaction',
    templateUrl: './tw-create-interaction.component.html',
    styleUrls: ['./tw-create-interaction.component.scss'],
    animations: widgetFabAnimations,
    encapsulation: ViewEncapsulation.None
})
export class TwCreateInteractionComponent implements OnInit, OnDestroy {
    @Input() data: IWidget;

    constructor(private matdialog: MatDialog) {}

    availableChannels = ['sms'];
    channels = [];

    ngOnInit(): void {}

    ngOnDestroy(): void {
        this.matdialog.closeAll();
    }

    addInteraction(channel: string): void {
        this.matdialog.open(CreateSmsComponent, {
            panelClass: 'create-sms-dialog'
        });
    }
}
