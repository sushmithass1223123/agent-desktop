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

    /**
     * flag to enable/disable reload of component
     */
    enableReload:boolean = false;

    constructor(@Inject(MAT_DIALOG_DATA)
        private dialogData: PreviewDialogDataTypes & CallbackActions,
        private _appUIService: AppUiService,
        private _translocoService: TranslocoService
    ) {
        // super('PreviewDialogComponent')
    }

    /**
     * Lifecycle hook
     */
    ngOnInit() {
        this.loadComponent();
    }

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

    async previewEmailComponent() {
        this.enableReload = true;
        const snackbarRef = this._appUIService.showSnackbar(this._translocoService.translate('interactionComponent.connectingMsg'), 'loading');
        if(this.dialogData.previewData?.sessionId) {
            this.loading = true;
            let sessionId;
            await SDKClient.getDataFromDataServer({
                query: "Type == \"email-response\" AND SubType == \"outSessionId\"",
                instance: ""
            })  
            .then((r) => {
                if (r && r.response) {
                    if(r.response && r.response[0]) {
                        const sessionData = r.response.find(d => this.dialogData.previewData?.interactionId?.toString() === d.InsertInteraction);
                        sessionId = JSON.parse(sessionData?.Data);    
                    }
                    
                }
            }).catch(e => {
                console.log('Error occured during Get data from data server', e);
            })
            let method;
            if(sessionId) {
                method = 'getOutboxEmail';
            } else {
                method = 'getInboxEmail';
                sessionId = this.dialogData.previewData?.sessionId;
            }
            
            SDKClient[method](sessionId)
            .then((resp: IResponse) => {
                this.loading = false;
                snackbarRef?.dismiss();
                // check the response
                // this._appUIService.showSnackbar('success', 'success');
                console.log('Performed action on EMAIL by supervisor', resp);
                this.data = resp.response;
            })
            .catch((e) => {
                snackbarRef?.dismiss();
                this.loading = false;
                this.data = {
                    error: true
                };
                this._appUIService.showSnackbar('Error in getting outbox email data', 'failure');
                console.log('e',e);
            });

        } else {
            console.log('Session ID not present to view email details by supervisor');
        }
    }

    

    performAction(action) {
        this.dialogData.done(action?.callback);
    }

}

