import { NestedTreeControl } from '@angular/cdk/tree';
import { HttpClient } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { DomSanitizer } from '@angular/platform-browser';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { TWidgetWrapper } from '@modules/t-widgets/utils';
import { AppDataService } from '@services/app-data.service';
import { COMMON_ERR_MESSAGE } from 'app/constants';
import { IWidget, ResData } from 'app/interfaces';
import { groupBy } from 'lodash';
import * as moment from 'moment';
import { takeUntil } from 'rxjs/operators';
import { SDKClient } from 'tmac-sdk';

@Component({
    selector: 'workbench-email', // make sure you set the selector starts with <widget-name>
    templateUrl: './workbench-email.component.html',
    styleUrls: ['./workbench-email.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class WorkbenchEmailComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    // holds all the data related to this widget from the config
    @Input() data: IWidget;

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store the fuse config for theme
    // -----------------------------------------------------------
    fuseConfig: FuseConfig;

    // -----------------------------------------------------------
    // @ [OPTIONAL] to store entire app config and get update
    // -----------------------------------------------------------
    appConfig: any;

    searchTerm = '';
    selectedMail: number;
    emailSearchRes: ResData<{ selected: any }> = {
        error: false,
        loading: false,
        msg: '',
        data: {
            selected: false
        }
    };
    advancedSearchForm = new FormGroup({
        email: new FormControl(''),
        queue: new FormControl(''),
        fromDate: new FormControl(''),
        fromTime: new FormControl(''),
        toDate: new FormControl(''),
        toTime: new FormControl(''),
        subject: new FormControl(''),
        content: new FormControl('')
    });

    treeControl = new NestedTreeControl<any>((node) => node.children);
    dataSource = new MatTreeNestedDataSource<any>();

    /**
     * Constructor
     * @param {FuseConfigService} _fuseConfigService
     * @param {AppDataService} _appDataService
     */
    constructor(
        // @ [OPTIONAL]
        private _fuseConfigService: FuseConfigService,
        // @ [OPTIONAL]
        private _appDataService: AppDataService,
        private http: HttpClient,
        private domSanitizer: DomSanitizer
    ) {
        super();
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        this.advancedSearchForm.patchValue({
            fromDate: yesterday,
            fromTime: `${yesterday.getHours()}:${yesterday.getMinutes()}`,
            toDate: today,
            toTime: `${today.getHours()}:${today.getMinutes()}`
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * A callback method that is invoked immediately after the default change detector has checked the directive's data-bound properties for the first time,
     * and before any of the view or content children have been checked. It is invoked only once when the directive is instantiated.
     */
    ngOnInit(): void {
        // -----------------------------------------------------------
        // @ [OPTIONAL] to get the fuse config
        // -----------------------------------------------------------
        this._fuseConfigService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.fuseConfig = config;
        });

        // -----------------------------------------------------------
        // @ [OPTIONAL] to get the app config
        // -----------------------------------------------------------
        this._appDataService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.appConfig = config;
        });

        this.advancedSearch();
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

    filterEmails(): void { }

    hasChild = (_: number, node: any) => !!node.children && node.children.length > 0;

    advancedSearch(): void {
        if (!this.data.Data.WorkbenchUrl) {
            this.emailSearchRes = {
                loading: false,
                error: true,
                msg: 'WorkbenchUrl not provided',
                data: { selected: this.emailSearchRes.data.selected || false }
            };
            return;
        }

        const { agentId } = SDKClient.getAgentData();

        const searchFields = this.advancedSearchForm.value;

        let startDate: any = '';
        let endDate: any = '';

        if (searchFields.fromDate) {
            startDate = new Date(searchFields.fromDate);
            startDate.setHours(searchFields.fromTime?.split(':')[0] || '00');
            startDate.setMinutes(searchFields.fromTime?.split(':')[1] || '00');
            startDate.setSeconds(0);
            startDate = moment(startDate).format('YYYYMMDDHHmmss');
        }

        if (searchFields.toDate) {
            endDate = new Date(searchFields.toDate);
            endDate.setHours(searchFields.toTime?.split(':')[0] || '00');
            endDate.setMinutes(searchFields.toTime?.split(':')[1] || '00');
            endDate.setSeconds(0);
            endDate = moment(endDate).format('YYYYMMDDHHmmss');
        }

        this.emailSearchRes.loading = true;

        this.http
            .post(this.data.Data.WorkbenchUrl + '/email/search', {
                skills: searchFields.skills ? [searchFields.skills] : [],
                email: searchFields.email,
                agent: '',
                startDate,
                endDate,
                subject: searchFields.subject,
                content: searchFields.content
            })
            .subscribe(
                (res: any) => {
                    if (res.status === 'SUCCESS') {
                        const mails = res.result.map((x: any) => {
                            const mailRes = JSON.parse(x.data);
                            mailRes.addedTime = x.addedTime;
                            mailRes.body = this.domSanitizer.bypassSecurityTrustHtml(mailRes.body);
                            return mailRes;
                        });
                        const byMailList = groupBy(mails, 'To');
                        const nodes = Object.keys(byMailList).map((name) => {
                            const test = groupBy(byMailList[name], 'Skill');
                            return { name, children: Object.keys(test).map((n) => ({ name: n, children: test[n] })) };
                        });
                        this.emailSearchRes = {
                            loading: false,
                            error: false,
                            msg: '',
                            data: { selected: this.emailSearchRes.data.selected || false }
                        };
                        this.dataSource.data = nodes;
                    } else {
                        this.emailSearchRes = {
                            loading: false,
                            error: true,
                            msg: COMMON_ERR_MESSAGE,
                            data: { selected: this.emailSearchRes.data.selected || false }
                        };
                    }
                },
                () => {
                    this.emailSearchRes = {
                        loading: false,
                        error: true,
                        msg: COMMON_ERR_MESSAGE,
                        data: { selected: this.emailSearchRes.data.selected || false }
                    };
                }
            );
    }

    pullEmail(): void {
        const { agentId } = SDKClient.getAgentData();
        const { SessionId, RouteId } = this.emailSearchRes.data.selected;
        this.http
            .post(this.data.Data.WorkbenchUrl + '/email/pull', {
                tmacServer: '',
                agentId,
                items: [
                    {
                        sessionId: SessionId,
                        routeId: RouteId,
                        conversationId: ''
                    }
                ]
            })
            .subscribe(
                (res: any) => {
                    if (res.status === 'FAILED') {
                        console.log({ err: res });
                        return;
                    }
                },
                (err) => {
                    console.log(err);
                }
            );
    }
}

// for more info visit - https://angular.io/api/core
