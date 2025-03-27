import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import {PreviewDialogDataTypes, PreviewComponentTypes, CallbackActions} from './preview.dialog';
import { AppUiService } from '@services/app-ui.service';
import { TranslocoService } from '@jsverse/transloco';
import { IAddEvent, IResponse, SDKClient } from '@tmac/sdk';
@Component({
    selector: 'preview-dialog',
    templateUrl: './preview-dialog.component.html',
    styleUrls: ['./preview-dialog.component.scss']
})
export class PreviewDialogComponent implements OnInit, OnDestroy {
    /**
     * Component to be loaded based on the condition
     */
    component!: PreviewComponentTypes;

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
    actions: any[] = [];

    /**
     * sessionId to track current interaction
     */
    sessionId: string;


    constructor(@Inject(MAT_DIALOG_DATA)
        public dialogData: PreviewDialogDataTypes & CallbackActions,
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

    ngOnDestroy() {
        SDKClient.events.off('DraftEmailUpdatesEvent', () => {
            console.log('unsubscribe: DraftEmailUpdatesEvent');
        });
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
                case 'email': 
                    this.requestMonitoring();
                    this.previewEmailComponent()
                    break;
            }
        }
    }

    /**
     * To attach a monitor event to agent's session
     */
    requestMonitoring() {
        let data: IAddEvent = {
            agentId: this.dialogData.previewData?.AgentId,
            eventString: JSON.stringify({
                EventName: "GenericEvent",
                SubEventName: "MonitorRequestFromSupervisor",
                JsonData: JSON.stringify({supervisorId: SDKClient.getAgentData().agentId, tmacServerName: SDKClient.getAgentData().tmacServer}),
            }),
            isPriority: true,
            toTmacServer:this.dialogData.previewData?.TmacServerName
        };
        
        SDKClient.addEventToAgentSession(data);
    }

   
    /**
     * 
     * method to view Email details being composed / viewed by Agent
     */
    previewEmailComponent() {
        // do not call the method again if already got the data from inbox / draft
        if(!this.loading) return;
        this.sessionId = this.dialogData.previewData?.SessionId;
        
        // call inbox email to get the email currently agent is viewing
        this.getEmailData();
        
        // register to a generic event `DraftEmailUpdatesEvent` which gives the drafting mail details
        SDKClient.events.on('DraftEmailUpdatesEvent', (evt) => {
        const val = JSON.parse(evt.JsonData);
        
        // close window if agent ends drafting email
        if(val.DraftStatus !== 'draft') {
            this.data.DraftStatus = val.DraftStatus;
            this.close(val);
            return;
        }
        // update values only if its relevant to the current session
        if(val.inboxSessionId === this.sessionId || val.outboxSessionId === this.sessionId) {
            this.data = {...val,...{
                ToList: val.toList,
                CCList: val.ccList,
                InboxSessionId: val.inboxSessionId,
                OutboxSessionId: val.outboxSessionId
            }};
            this.loading = false;
            this.data['isDraft'] = true;
        }
        
        });
    }

    /**
     * get current viewing email data
     */
    getEmailData() {
        SDKClient.getInboxEmail(this.sessionId)
            .then((resp: IResponse) => {
                if(resp.response !== null) {
                    this.loading = false;
                    this.data = resp.response;
                    this.data['isDraft'] = false;
                } else {
                    this.getOutboxEmailData();
                }
            })
            .catch((e) => {
                this.loading = false;
                this.data = {
                    error: true
                };
                this._appUIService.showSnackbar('Error in getting inbox email data', 'failure');
                console.log('e',e);
            });
    }

    /**
     * If failed to get inbox email data then look for outboxemail data with current sessionId
     */
    getOutboxEmailData() {
        SDKClient.getOutboxEmail(this.sessionId)
            .then((resp: IResponse) => {
                if(resp.response !== null) {
                    this.sessionId = resp.response?.InSessionID;
                    this.loading = false;
                    this.data = resp.response;
                    this.data['isDraft'] = false;
                }
            });
    }

    
    /**
     * 
     * method to perform actions
     */
    performAction(action:any) {
        this.dialogData.done(action?.callback);
    }

    /**
     * 
     * @param data : email data
     * method to close preview window
     */
    close(data) {
        switch(data.DraftStatus) {
            case 'preview': 
            this.getEmailData();
            return;
        }
        setTimeout(() => {
            this.dialogData.done();
        }, 5000);
    }

}

