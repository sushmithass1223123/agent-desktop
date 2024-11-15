import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import {PreviewDialogDataTypes, PreviewComponentTypes, CallbackActions} from './preview.dialog';
import { AppUiService } from '@services/app-ui.service';
import { TranslocoService } from '@ngneat/transloco';
import { IResponse, SDKClient } from '@tmac/sdk';
@Component({
    selector: 'preview-dialog',
    templateUrl: './preview-dialog.component.html',
    styleUrls: ['./preview-dialog.component.scss']
})
export class PreviewDialogComponent implements OnInit {
    /**
     * Component to be loaded based on the condition
     */
    component: PreviewComponentTypes;

    /**
     * Data related to component 
     */
    data: any;

    /**
     * title of the dialog
     */
    title: string;

    /**
     * If component data loading 
     */
    loading: boolean = true;

    /**
     * actions to perform
     */
    actions = [];



    constructor(@Inject(MAT_DIALOG_DATA)
        private dialogData: PreviewDialogDataTypes & CallbackActions,
        private _appUIService: AppUiService,
        private _translocoService: TranslocoService
    ) {
    }

    /**
     * Lifecycle hook
     */
    ngOnInit() {
        this.loadComponent();
    }

    /**
     * method to load components based on the component value send in dialog data
     */
    loadComponent() {
        if(this.dialogData) {
            this.component = this.dialogData.component ?? 'other';
            this.title = this.dialogData.title ?? 'Preview Component';
            this.actions = this.dialogData.actions ?? [];
            switch(this.component) {
                case 'email': this.previewEmailComponent()
                    break;
            }
        }
    }

   
    /**
     * 
     * method to view Email details being composed / viewed by Agent
     */
    previewEmailComponent() {
        // do not call the method again if already got the data from inbox / draft
        if(!this.loading) return;

        // call inbox email to get the email currently agent is viewing
        SDKClient.getInboxEmail(this.dialogData.previewData?.SessionId)
            .then((resp: IResponse) => {
                if(resp.response !== null) {
                    this.loading = false;
                    this.data = resp.response;
                    this.data['isDraft'] = false;
                }
            })
            .catch((e) => {
                this.loading = false;
                this.data = {
                    error: true
                };
                this._appUIService.showSnackbar('Error in getting outbox email data', 'failure');
                console.log('e',e);
            });
        
        // register to a generic event `DraftEmailUpdatesEvent` which gives the drafting mail details
        SDKClient.events.on('DraftEmailUpdatesEvent', (evt) => {
        const val = JSON.parse(evt.JsonData);
        this.data = {...val,...{
            ToList: val.toList,
            CCList: val.ccList,
            InboxSessionId: val.inboxSessionId,
            OutboxSessionId: val.outboxSessionId
        }};
        this.loading = false;
        this.data['isDraft'] = true;
        });
    }

    
    /**
     * 
     * method to perform actions
     */
    performAction(action) {
        this.dialogData.done(action?.callback);
    }

}

