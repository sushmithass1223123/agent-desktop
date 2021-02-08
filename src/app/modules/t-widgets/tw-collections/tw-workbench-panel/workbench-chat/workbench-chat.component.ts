import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { IWidget } from 'app/interfaces';

/**
 * Workbench Chat
 */
@Component({
    selector: 'workbench-chat',
    templateUrl: './workbench-chat.component.html',
    styleUrls: ['./workbench-chat.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class WorkbenchChatComponent implements OnInit {
    /**
     * holds all the data related to this widget from the config
     */
    @Input() data: IWidget;

    constructor() { }

    /**
     * On Init
     */
    ngOnInit(): void {
    }

}
