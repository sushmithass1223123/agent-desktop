import { NestedTreeControl } from '@angular/cdk/tree';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { TWidgetWrapper } from '@modules/t-widgets/utils';
import { AppUiService } from '@services/app-ui.service';
import { IWidget } from 'app/interfaces';
import { formatJsonData } from 'app/utils';
import { groupBy, sortBy } from 'lodash';
import * as moment from 'moment';
import { catchError, filter, map, takeUntil } from 'rxjs/operators';
import { SDKClient } from 'tmac-sdk';

type ApiCalls = 'search' | 'pull' | 'push';
type CallStates = 'loading' | 'error' | 'initial' | 'completed';

const temp = {
    itemID: 'dev210216205853_1357',
    customerIdentifier: '',
    channel: 'textchat',
    subChannel: 'textchat',
    skillId: '50053',
    skillName: null,
    status: 0,
    agentID: '',
    reason: '',
    routeDate: '',
    routeTime: '',
    createdBy: 'chatserver',
    orderIndex: 141,
    key: 'ef4b8383-1fea-4587-b4bf-d366f875f175',
    addedTime: '2021-02-16T20:58:57.284806+08:00',
    ronaEnabled: false,
    data: {
        pChannel: 'textchat',
        pIntent: 'ccpmaker',
        pChatBotSid: '6b0b2cd2-d604-4f19-ad4e-7b2effe1b87b',
        pUcid: '',
        visualivr: '1',
        pLocation: '9.9668,76.2863',
        agentid: '',
        interactionid: '',
        node: '',
        mobile: '96975347',
        sessionID: '1362',
        chatmode: 'text',
        QUEUE_TIME: '2',
        vachatid: 'dev210216221639_1362|',
        tchatsid: 'dev210216221639_1362',
        customerName: 'Mr. Tan',
        Intent: 'WiFiIssues',
        param1: null,
        param2:
            '{"pChannel":"textchat","pIntent":"ccpmaker","pChatBotSid":"6b0b2cd2-d604-4f19-ad4e-7b2effe1b87b","pUcid":"","visualivr":"1","pLocation":"9.9668,76.2863","agentid":"","interactionid":"","node":"","mobile":"","sessionID":"1362","chatmode":"text","QUEUE_TIME":"2","vachatid":"dev210216221639_1362|","tchatsid":"dev210216221639_1362","phoneNumber":"96975347","SMSText":"Your OTP is 454123 from VIVR session?ucid=ucid","ModuleName":"SendSMS","errorCode":"-1","SMSTemplate":"Your OTP is 454123 from VIVR session?ucid=ucid","ContactNumber":"96975347","HostStatus":"Y","SessionId":"dev210216221639_1362","Channel":"Chat","NextNodeID":"0f563e52-07fa-4ffd-9b30-239fa9c23460-025553123","FlowType":"MAKER","otp":"969753","authType":"OTPAuthenticated","authStatus":"Authenticated","imageCaptureUrl":"https://dice.tetherfi.cloud:8443/api1/upload-download-file?file-name=Screenshot_1.png","Queue_noagent_noinputtext":"We have not received any input from you"}',
        param3:
            '{\r\n  "pChannel": "textchat",\r\n  "pIntent": "ccpmaker",\r\n  "pChatBotSid": "6b0b2cd2-d604-4f19-ad4e-7b2effe1b87b",\r\n  "pUcid": "",\r\n  "visualivr": "1",\r\n  "pLocation": "9.9668,76.2863",\r\n  "agentid": "",\r\n  "interactionid": "",\r\n  "node": "",\r\n  "mobile": "",\r\n  "sessionID": "1362",\r\n  "chatmode": "text",\r\n  "QUEUE_TIME": "2",\r\n  "vachatid": "dev210216221639_1362|",\r\n  "tchatsid": "dev210216221639_1362"\r\n}',
        param4: '96975347',
        param5: {
            skillBasedRouting: true,
            skill: '49033',
            attributeBasedRouting: false,
            routingAttribues: {},
            lastAgentRouting: false,
            dacAttribues: {},
            dacAge: 10,
            tmacTempalteName: 'Technical',
            widgets:
                '{\r\n  "widgets": [\r\n    {\r\n      "name": "Sentiment",\r\n      "type": "tw-customer-sentiment",\r\n      "params": {\r\n        "SentimentDetails": "1234"\r\n      }\r\n    },\r\n    {\r\n      "name": "WorkCode",\r\n      "type": "tw-work-codes",\r\n      "params": {\r\n        "CallDetails": "1234"\r\n      }\r\n    },\r\n    {\r\n      "name": "AgentAssist",\r\n      "type": "tw-agent-assist",\r\n      "params": {\r\n        "CallDetails": "1234"\r\n      }\r\n    },\r\n    {\r\n      "name": "CallbackRegister",\r\n      "type": "tw-callback-register",\r\n      "params": {\r\n        "CallDetails": "1234"\r\n      }\r\n    },\r\n    {\r\n      "name": "Amdoc-Bcc",\r\n      "type": "tw-amdocs-bcc",\r\n      "params": {\r\n        "CallDetails": "1234"\r\n      }\r\n    },\r\n    {\r\n      "name": "Account Information",\r\n      "type": "tw-account-information",\r\n      "params": {\r\n        "CallDetails": "1234"\r\n      }\r\n    },\r\n    {\r\n      "name": "Canned Responses",\r\n      "type": "tw-canned-responses",\r\n      "params": {\r\n        "CallDetails": "1234"\r\n      }\r\n    }\r\n  ],\r\n  "keys": {\r\n    "allowVideo": "true",\r\n    "allowDisconnect": "true",\r\n    "allowTransfer": "true",\r\n    "SentimentDetails": "1234",\r\n    "allowAudio": "true",\r\n    "allowScreenshare": "true",\r\n    "allowCobrowse": "true"\r\n  }\r\n}',
            totalWaitTime: 180
        }
    }
};

/**
 * Workbench Chat
 */
@Component({
    selector: 'workbench-chat',
    templateUrl: './workbench-chat.component.html',
    styleUrls: ['./workbench-chat.component.scss']
})
export class WorkbenchChatComponent extends TWidgetWrapper implements OnInit {
    /**
     * holds all the data related to the parent tw workbecnh widget from the config
     */
    @Input() data: IWidget;
    /**
     * holds all the data related to this workbench tab
     */
    @Input() channelConf: any;

    /**
     * Fetched Queued Chats observable
     */
    queuedChats: any[];
    /**
     * Advanced search visibility
     */
    showAdvancedSearchForm = false;

    /**
     * Tree Controls
     */
    treeControl = new NestedTreeControl<any>((node) => node.children);
    /**
     * Tree Data source
     */
    dataSource = new MatTreeNestedDataSource<any>();

    /**
     * Advanced Search form control
     */
    advancedSearchForm = new FormGroup({
        skills: new FormControl(''),
        agent: new FormControl(''),
        fromTime: new FormControl(''),
        fromDate: new FormControl(''),
        toTime: new FormControl(''),
        toDate: new FormControl('')
    });
    /**
     * To store the fuse config for theme
     */
    fuseConfig: FuseConfig;

    /**
     * Api Call states
     */
    callStates: Record<ApiCalls, CallStates> = {
        pull: 'initial',
        push: 'initial',
        search: 'loading'
    };

    /**
     * Global search form control
     */
    globalSearchControl = new FormControl('');

    /**
     * Selected skill's unique key
     */
    selectedSkill = '';

    /**
     * Chats cards ref
     */
    @ViewChild('chatsRef')
    chatsRef: ElementRef<HTMLDivElement>;

    constructor(private http: HttpClient, private _fuseConfigService: FuseConfigService, private appUiService: AppUiService) {
        super();
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        this.advancedSearchForm.patchValue({
            fromDate: yesterday,
            fromTime: `00:00`,
            toDate: today,
            toTime: `${'23'}:${'59'}`
        });
    }

    /**
     * On Init
     */
    ngOnInit(): void {
        this._fuseConfigService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.fuseConfig = config;
        });
        this.doAdvancedSearch();
    }

    /**
     * Does Advance search and Gets Queued Chats
     */
    doAdvancedSearch(searchParams?: any): void {
        try {
            const searchFields = searchParams || this.advancedSearchForm.value;
            const { agentId } = SDKClient.getAgentData();

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

            this.callStates.search = 'loading';
            this.http
                .post<any[]>(this.data.Data.WorkbenchUrl + '/chat/queue/search', {
                    skills: searchFields.skills ? [searchFields.skills] : [],
                    agent: '',
                    startDate,
                    endDate
                })
                .subscribe((res: any) => {
                    if (!res || res.status !== 'SUCCESS') {
                        this.appUiService.showSnackbar('Unable to complete advanced search', 'failure');
                        return;
                    }
                    this.queuedChats = res.result;
                    // if (res.result.length === 0) {
                    //     this.queuedChats = Array(10).fill(temp);
                    // }
                    this.queuedChats = this.queuedChats.map((x, i) => ({
                        ...formatJsonData(
                            { ...x, data: JSON.parse(x.data) },
                            {
                                name: ['data', 'pName'],
                                intent: ['data', 'pIntent'],
                                customerName: ['data', 'customerName'],
                                channel: 'channel',
                                skillId: 'skillId',
                                itemID: 'itemID',
                                addedTime: 'addedTime',
                                'display.Skill': 'skillId',
                                'display.Created By': ['data', 'customerName'],
                                'display.Sub-Channel': 'subChannel',
                                'display.Name': ['data', 'customerName'],
                                'display.Mobile No': ['data', 'mobile'],
                                'display.Session ID': ['data', 'sessionID'],
                                'display.Agent Id': '',
                                'display.User Id': '',
                                'display.Gender': '',
                                'display.Nationality': '',
                                'display.Language': ''
                            }
                        ),
                        uiKey: `ui_${i}`
                    }));
                    const nodesByChannel = groupBy(this.queuedChats, 'channel');
                    this.dataSource.data = Object.keys(nodesByChannel).map((name) => {
                        const nodesBySkillId = groupBy(nodesByChannel[name], 'skillId');
                        return {
                            name,
                            children: nodesByChannel[name].map((x) => {
                                const grandChildren = sortBy(nodesBySkillId[x.skillId], 'addedTime');
                                return {
                                    ...x,
                                    grandChildren: grandChildren,
                                    oldestSince: new Date(grandChildren[0].addedTime)
                                };
                            })
                        };
                    });
                });
        } catch (e) {
            console.error(e);
            this.appUiService.showSnackbar('Unable to complete advanced search', 'failure');
        }
    }

    /**
     * Does a global search
     */
    doGlobalSearch(): void {
        const globalKey = this.globalSearchControl.value;
        const { agentId } = SDKClient.getAgentData();

        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        const searchParams = {
            skills: [globalKey],
            agent: '',
            startDate: moment(today).format('YYYYMMDDHHmmss'),
            endDate: moment(yesterday).format('YYYYMMDDHHmmss')
        };
    }

    /**
     * Check if tree node has child
     * @param {number} _
     * @param {any} node
     */
    hasChild = (_: number, node: any) => !!node.children && node.children.length > 0;

    /**
     * selects skill and scrolls to the skill
     * @param node
     */
    selectSkill(node: any): void {
        const element = document.getElementById(node.uiKey);
        this.selectedSkill = node.uiKey;
        if (element) {
            this.chatsRef.nativeElement.scrollTop = element.offsetTop - 50;
        } else {
            console.error('Element not found !!!!');
        }
    }

    /**
     * Pulls email
     * @param {any} node
     */
    pullChat(node: any): void {
        try {
            const { tmacServer, agentId } = SDKClient.getAgentData();
            const { channel, itemID: itemid } = node;
            this.appUiService.showSnackbar('Pulling Chat', 'loading');
            this.http
                .post(this.data.Data.WorkbenchUrl + '/chat/queue/pull', {
                    tmacServer,
                    agentId,
                    channel: channel,
                    items: [{ itemid }]
                })
                .subscribe((res: any) => {
                    if (res && res.status !== 'FAILED') {
                        this.appUiService.showSnackbar('Chat Pushed successfuly', 'success');
                        return;
                    }
                    this.appUiService.showSnackbar('Unable to Pull chat', 'failure');
                });
        } catch (e) {
            console.error(e);
            this.appUiService.showSnackbar('Chat Pull failed', 'failure');
        }
    }

    /**
     * Pulls email
     * @param {any} node
     */
    pushChat(node: any): void {
        try {
            const { tmacServer, agentId } = SDKClient.getAgentData();
            const { channel, itemID: itemid } = node;
            this.appUiService.showSnackbar('Pushing Chat', 'loading');
            this.http
                .post(this.data.Data.WorkbenchUrl + '/chat/queue/push', {
                    tmacServer,
                    agentId,
                    channel: channel,
                    items: [{ itemid }]
                })
                .subscribe((res: any) => {
                    if (res && res.status !== 'FAILED') {
                        this.appUiService.showSnackbar('Chat Pushed successfuly', 'success');
                        return;
                    }
                    this.appUiService.showSnackbar('Unable to push chat', 'failure');
                });
        } catch (e) {
            console.error(e);
            this.appUiService.showSnackbar('Chat Push failed', 'failure');
        }
    }
}
