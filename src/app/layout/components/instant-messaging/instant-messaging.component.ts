import { AOTWidget } from '@ad/types';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { NgForm } from '@angular/forms';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { appAnimations } from '@modules/shared/animations/app.animation';
import { SharedWrapper } from '@modules/t-widgets/utils/widget-wrapper/shared-wrapper';
import { AOTWidgetService } from '@services/aot-widget.service';
import { AppUiService } from '@services/app-ui.service';
import { DashboardService } from '@services/dashboard.service';
import { TMACEventService } from '@services/tmac-event.service';
import { AgentAVMessageEvent, AgentNotificaitonEvent, AVControlMessageReceivedEvent, IAgentData, SDKClient, SuAgentModel, TUtils } from '@tmac/sdk';
import { CustomSDKEvent, IWidget } from 'app/interfaces';
import { TwWidgetModel } from 'app/models';
import { addSeconds, isAfter } from 'date-fns';
import { groupBy, sortBy, uniqBy } from 'lodash';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { InstantMessagingService } from './instant-messaging.service';

/**
 * Contact model
 */
interface Contact {
    /**
     * avatar url
     */
    avatar: string;
    /**
     * Id
     */
    id: string;
    /**
     * Name of user
     */
    name: string;
    /**
     * Status of user
     */
    status: string;
    /**
     * number of Unread messages from user
     */
    unread: number;
    /**
     * TMAC server
     */
    tmacServer: string;
    /**
     * Last update time
     */
    lastUpdateDateTime: number;
}

/**
 * Chat
 */
interface Chat {
    /**
     * Chat dialog
     */
    dialog: any[];
    /**
     * Chat Id
     */
    id: string;
}

/**
 * Instant Messaging Component
 */
@Component({
    selector: 'instant-messaging',
    templateUrl: './instant-messaging.component.html',
    styleUrls: ['./instant-messaging.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: appAnimations
})
export class InstantMessagingComponent extends SharedWrapper implements OnInit, OnDestroy {
    /**
     * contact List
     */
    contacts: Contact[] = [];

    /**
     * all chats
     */
    allChats: Record<string, Chat> = {};

    /**
     * allNewChats
     */
    allNewChats: Record<string, string> = {};

    /**
     * Current Chat
     */
    chat: Chat;

    /**
     * Selected Contact
     */
    selectedContact: Contact;

    /**
     * user
     */
    user: IAgentData;

    /**
     * Data loading flag
     */
    loading: boolean;

    /**
     * reply form ref
     */
    @ViewChild('replyForm')
    private _replyForm: NgForm;

    /**
     * reply input ref
     */
    @ViewChild('replyInput')
    private _replyInput: ElementRef;

    // Private
    /**
     * Chat scrollbar ref
     */
    @ViewChild('messages')
    private _chatViewScrollbar: ElementRef<HTMLDivElement>;

    /**
     * Unsubscribe all subject
     */
    private _unsubscribeAll: Subject<any>;

    /**
     * To open actions
     */
    openActions: boolean;

    /**
     * Action buttons
     */
    actions = [];

    /**
     * AV call widget ref
     */
    callWidget: IWidget;

    /**
     * Config for instant messaging
     */
    config: WidgetData;

    /**
     * Agent features list
     */
    agentFeatures: {
        /**
         * To allow screenshare
         */
        screenshare: boolean;
        /**
         * To allow hold
         */
        hold: boolean;
        /**
         * To allow snapshot
         */
        snapshot: boolean;
        /**
         * To allow webrtc test
         */
        webrtcTest: boolean;
    };

    /**
     * Constructor
     *
     * @param {FuseSidebarService} _fuseSidebarService
     */
    constructor(
        private _fuseSidebarService: FuseSidebarService,
        private _tmacEventService: TMACEventService,
        private _dashboardService: DashboardService,
        private _instantMessagingService: InstantMessagingService,
        private _aotWidgetService: AOTWidgetService,
        private _appUIService: AppUiService
    ) {
        super('InstantMessagingComponent');
        // Set the defaults
        this.selectedContact = null;
        this._unsubscribeAll = new Subject();
        this.agentFeatures = {
            screenshare: false,
            hold: false,
            snapshot: false,
            webrtcTest: false
        };
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this.user = SDKClient.getAgentData();

        // Subscribe to the foldedChanged observable
        this._fuseSidebarService
            .getSidebar('chatPanel')
            .openedChanged.pipe(takeUntil(this._unsubscribeAll))
            .subscribe((opened) => {
                // check to get team list
                if (opened) {
                    this._dashboardService.triggerTeamAgentList(this.user.agentId, this.user.teamId, true, this.config.TeamFilter ?? false);
                    this.loading = true;
                    setTimeout(() => {
                        if (this.loading) {
                            this.loading = false;
                        }
                    }, 10000);
                } else {
                    this._dashboardService.triggerTeamAgentList(this.user.agentId, this.user.teamId, false, this.config.TeamFilter ?? false);
                    //this.resetChat();
                }
            });

        this._tmacEventService
            .getNonInteractionEvents([
                'TeamAgentListEvent',
                'AgentNotificaitonEvent',
                'SupervisorAgentListEvent',
                'AgentAVMessageEvent',
                'DisposeIMCallWidgetEvent'
            ])
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((evts) => evts.forEach((evt) => this[evt.EventName](evt)));

        this._instantMessagingService.getUser.pipe(takeUntil(this._unsubscribeAll)).subscribe((x: string) => {
            // get user by id
            if (x) {
                // select the user by id
                const user = this.contacts.filter((c) => c.id === x);
                // if user found the toggle chat
                if (user.length) {
                    this.toggleChat(user[0]);
                }
            }
        });

        this._instantMessagingService.getConfig.pipe(takeUntil(this._unsubscribeAll)).subscribe((x: WidgetData) => {
            this.config = x;
            // check for audio enabled
            if (x.AudioEscalateAllowed) {
                this.actions.push({
                    label: 'Video Call',
                    icon: 'video_call',
                    type: 'video'
                });
            }
            // check for video enabled
            if (x.VideoEscalateAllowed) {
                this.actions.push({
                    label: 'Voice Call',
                    icon: 'call',
                    type: 'audio'
                });
            }

            this.agentFeatures.screenshare = x.ScreenShareAllowed;
        });

        // this._instantMessagingService.getActiveAgents.pipe(takeUntil(this._unsubscribeAll)).subscribe((x: boolean) => {
        //     if (x === false) {
        //         this.supervisorAgentList = [];
        //     }
        // });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Prepare the chat for the replies
     */
    private _prepareChatForReplies(): void {
        setTimeout(() => {
            // Focus to the reply input
            this._replyInput?.nativeElement?.focus();

            // Scroll to the bottom of the messages list
            if (this._chatViewScrollbar) {
                setTimeout(() => {
                    this._chatViewScrollbar.nativeElement.scrollTop = this._chatViewScrollbar.nativeElement.scrollHeight;
                }, 200);
            }
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Toggle sidebar opened status
     */
    toggleSidebarOpen(): void {
        this._fuseSidebarService.getSidebar('chatPanel').toggleOpen();
    }

    /**
     * Decide whether to show or not the contact's avatar in the message row
     *
     * @param message
     * @param i
     * @returns {boolean}
     */
    shouldShowContactAvatar(message: AgentNotificaitonEvent, i: number): boolean {
        return (
            message.FromAgentId === this.selectedContact.id &&
            ((this.chat.dialog[i + 1] && this.chat.dialog[i + 1].FromAgentId !== this.selectedContact.id) || !this.chat.dialog[i + 1])
        );
    }

    /**
     * Check if the given message is the first message of a group
     *
     * @param message
     * @param i
     * @returns {boolean}
     */
    isFirstMessageOfGroup(message: AgentNotificaitonEvent, i: number): boolean {
        return i === 0 || (this.chat.dialog[i - 1] && this.chat.dialog[i - 1].FromAgentId !== message.FromAgentId);
    }

    /**
     * Check if the given message is the last message of a group
     *
     * @param message
     * @param i
     * @returns {boolean}
     */
    isLastMessageOfGroup(message: AgentNotificaitonEvent, i: number): boolean {
        return i === this.chat.dialog.length - 1 || (this.chat.dialog[i + 1] && this.chat.dialog[i + 1].FromAgentId !== message.FromAgentId);
    }

    /**
     * To get agent status
     *
     * @param contact
     * @returns
     */
    async getAgentStatus(contact: Contact): Promise<Contact> {
        try {
            if (contact.status !== 'Not Logged In' && isAfter(new Date(), addSeconds(contact.lastUpdateDateTime, 10))) {
                const { response } = await SDKClient.getAgentStatus({
                    agentId: contact.id,
                    deviceId: '',
                    tmacServer: contact.tmacServer
                });

                return {
                    ...contact,
                    status: response ? response.ResultMessage : 'Not Logged In',
                    lastUpdateDateTime: Date.now()
                };
            }
        } catch (error) {}
        return contact;
    }

    /**
     * Toggle chat with the contact
     *
     * @param contact
     */
    async toggleChat(contact: Contact): Promise<void> {
        // If the contact equals to the selectedContact,
        // that means we will deselect the contact and unload the chat
        this.contacts = this.contacts.map((x) => ({ ...x, unread: x.id === contact.id ? 0 : x.unread }));

        if (!this.selectedContact || contact.id !== this.selectedContact.id) {
            // check if contact info is there
            if (!contact.status) {
                contact = await this.getAgentStatus(contact);
            }

            // check if the contact in list, if not push it
            const idx = this.contacts.findIndex((f) => f.id === contact.id);
            if (idx < 0) {
                this.contacts.push(contact);
            } else {
                // update the status and lastUpdateDateTime only
                // updating the whole object will reset the unread count
                // which is cleared in the begining of this method
                this.contacts[idx].status = contact.status;
                this.contacts[idx].lastUpdateDateTime = contact.lastUpdateDateTime;
            }

            this.selectedContact = contact;
            // Use setTimeout to focus on the input after Angular has rendered it
        setTimeout(() => {
            const textarea = this._replyInput.nativeElement;
            const length = textarea.value.length;
            textarea.setSelectionRange(length, length);
            textarea.focus();
        });
            this.chat = this.allChats[contact.id] || { id: contact.id, dialog: [] };
        }

        this._prepareChatForReplies();
    }

    /**
     * Remove the selected contact and unload the chat
     */
    resetChat(): void {
        // Set the selected contact as null
        this.selectedContact = null;

        // Set the chat as null
        this.chat = null;
        // Set the allNewChats as null
        this.allNewChats = null;
    }

    /**
     * Reply
     */
    async reply(event): Promise<void> {
        event.preventDefault();
        if (this._replyForm.form.value.message.trim() == '') {
            return;
        }

        if (!this._replyForm.form.value.message) {
            return;
        }

        let state = 0;

        const message = {
            FromAgentId: this.user.agentId,
            Message: this._replyForm.form.value.message,
            MessageId: TUtils.Generic.uuid(),
            CreatedTime: new Date(),
            Status: state
        };

        // Reset the reply form
        this._replyForm?.reset();
        this._prepareChatForReplies();

        try {
            // Add the message to the chat
            if (!this.allChats[this.selectedContact.id]) {
                this.allChats[this.selectedContact.id] = { dialog: [], id: this.selectedContact.id };
            }

            this.allChats[this.selectedContact.id].dialog.push(message);
            this.chat = this.allChats[this.selectedContact.id];

            const { response } = await SDKClient.sendIM({
                message: message.Message,
                pop: false,
                toAgentId: this.selectedContact.id,
                toInteractionId: '',
                toTmacServer: this.selectedContact.tmacServer
            });

            if (response === 1) {
                state = 1;
            } else {
                state = -1;
            }

            if (response === -480) {
                this._appUIService.showSnackbar(`Message send failed, ${this.selectedContact.name} has logged out!`, 'failure');
                this.selectedContact.status = 'Not Logged In';
            }
        } catch (err) {
            this.logger.error('Error in sendIM', err, false);
            this._appUIService.showSnackbar('Error in sending message', 'failure');
        } finally {
            let dialog = this.allChats[this.selectedContact.id].dialog;
            dialog = dialog.map((x) => {
                if (x.MessageId === message.MessageId) {
                    x.Status = state;
                }
                return x;
            });
            this.allChats[this.selectedContact.id].dialog = dialog;

            // // Reset the reply form
            // this._replyForm.reset();
            // this._prepareChatForReplies();
        }
    }

    /**
     * AgentNotificaitonEvent handler
     * @param {AgentNotificaitonEvent} evt
     */
    AgentNotificaitonEvent = async (evt: AgentNotificaitonEvent) => {
        if (evt.InteractionID > 0 || evt.Type !== 'IM') {
            return;
        }

        if (!this.allChats[evt.FromAgentId]) {
            this.allChats[evt.FromAgentId] = { dialog: [], id: evt.FromAgentId };
        }

        this.allChats[evt.FromAgentId].dialog.push({
            FromAgentId: evt.FromAgentId,
            Message: evt.Message,
            MessageId: TUtils.Generic.uuid(),
            CreatedTime: evt.CreatedTime,
            Status: 1
        });

        // check if this contact in list
        if (!this.contacts.find((c) => c.id === evt.FromAgentId)) {
            let contact: Contact = {
                avatar: '',
                id: evt.FromAgentId,
                name: evt.FromAgentName,
                status: '',
                tmacServer: evt.FromTmacServer,
                unread: 0,
                lastUpdateDateTime: 0
            };

            contact = await this.getAgentStatus(contact);

            // add to the list
            this.contacts.push(contact);
        }

        if (evt.FromAgentId !== this.selectedContact?.id) {
            this.contacts = this.contacts.map((x) => ({ ...x, unread: x.id === evt.FromAgentId ? x.unread + 1 : x.unread }));
        } else {
            this.chat = this.allChats[evt.FromAgentId];
        }

        this._prepareChatForReplies();
    };

    /**
     * To process AgentAVMessageEvent
     *
     * @param evt
     */
    AgentAVMessageEvent = (evt: AgentAVMessageEvent): void => {
        // check the type of message
        if (evt.Type === 'requestav') {
            // check the type
            const type = JSON.parse(evt.Message).param;
            this.openCallWidget(type, 'in', evt);
        }
        // else {
        //     // send to the widget through data
        //     this.callWidget.Data.OnMessage(evt.Message);
        // }
    };

    /**
     * TeamAgentListEvent Handler
     * @param {CustomSDKEvent} evt
     */
    TeamAgentListEvent = (evt: CustomSDKEvent): void => {
        if (this.loading) {
            this.loading = false;
        }

        // // get current contact list
        // const curContacts = this.contacts;

        // // group agents by id
        // const contacts = groupBy(curContacts, 'id');

        // // create new contact list
        // const newContacts = sortBy(evt.Data, 'AgentName').map((x) => ({
        //     avatar: x.ProfilePicture,
        //     id: x.AgentLoginID,
        //     name: x.AgentName,
        //     status: x.CurrentAgentStatus,
        //     unread: contacts[x.AgentLoginID] ? contacts[x.AgentLoginID][0].unread : 0,
        //     tmacServer: x.TmacServer
        // }));

        // // create contact list merging both items
        // this.contacts = uniqBy(newContacts.concat(curContacts), 'id');

        this.processAgentList(evt.Data);
    };

    /**
     * To process SupervisorAgentListEvent
     */
    SupervisorAgentListEvent = (evt: CustomSDKEvent): void => {
        let data = [...evt.Data];
        if (evt.Data?.length) {
            // filter out local agent
            data = data.filter((d: SuAgentModel) => d.AgentLoginID !== SDKClient.getAgentData().agentId);
        }

        // // get contact list grouped by id
        // const contacts = groupBy(this.contacts, 'id');

        // // add to the list
        // this.contacts = sortBy(evt.Data, 'AgentName').map((x) => ({
        //     avatar: x.ProfilePicture,
        //     id: x.AgentLoginID,
        //     name: x.AgentName,
        //     status: x.CurrentAgentStatus,
        //     unread: contacts[x.AgentLoginID] ? contacts[x.AgentLoginID][0].unread : 0,
        //     tmacServer: x.TmacServer
        // }));

        this.processAgentList(data);
    };

    /**
     * To process custom DisposeIMCallWidgetEvent and dispose call widget
     */
    DisposeIMCallWidgetEvent(): void {
        this.disposeCallWidget();
    }

    /**
     * To process agent list
     *
     * @param { any } data
     *
     */
    async processAgentList(data: any[]): Promise<void> {
        const contactList = data;

        // get contact list grouped by id
        const contacts = groupBy(this.contacts, 'id');

        const currContacts = this.contacts;

        // create new contact list
        const newContacts: Contact[] = contactList.map((x) => ({
            avatar: x.ProfilePicture,
            id: x.AgentLoginID,
            name: x.AgentName,
            status: x.CurrentAgentStatus,
            unread: contacts[x.AgentLoginID] ? contacts[x.AgentLoginID][0].unread : 0,
            tmacServer: x.TmacServer,
            lastUpdateDateTime: Date.now()
        }));

        this.contacts = sortBy(uniqBy(newContacts.concat(currContacts), 'id'), 'name');

        // if there is any selected agent, then update the data
        if (this.selectedContact) {
            let contact = this.contacts.find((c) => c.id === this.selectedContact.id);
            contact = await this.getAgentStatus(contact);
            // if updated, update the same in contacts
            if (this.selectedContact.lastUpdateDateTime !== contact.lastUpdateDateTime) {
                this.contacts = this.contacts.map((x) => (x.id === contact.id ? contact : x));
            }
            // update the selected contact
            this.selectedContact = contact;
        }
    }

    /**
     * Track by for avoiding rerender
     * @method trackByID
     * @param {number} index
     * @param {any} contact
     */
    trackByID(index: number, contact: any): string {
        return contact.ID;
    }

    /**
     * To make a call to selected agent
     *
     * @param { 'audio' | 'video' } type
     */
    makeCall(type: 'audio' | 'video'): void {
        this.openCallWidget(type, 'out', null);
        this.openActions = false;
        this.toggleSidebarOpen();
        this.resetChat();
    }

    /**
     * To open voice or video call widget
     * @param {'audio' | 'video'} param Type of call
     * @param {'in' | 'out'} direction Direction of the call
     * @param {AVControlMessageReceivedEvent} avEvent [OPTIONAL] For incoming requestav to process AVControlMessageReceivedEvent
     */
    private openCallWidget(param: 'audio' | 'video', direction: 'in' | 'out', avEvent?: AgentAVMessageEvent): void {
        // if the widget is created then ignore
        if (this.callWidget) {
            return;
        }

        // get the widget type
        const widgetMode = {
            title: 'AV Controls',
            type: 'tw-audio-video-controls',
            icon: param === 'audio' ? 'phone' : 'duo'
        };
        // create a call AOT widget
        const widget = new TwWidgetModel(widgetMode.title, widgetMode.type, widgetMode.icon);
        widget.Config.Anchor = true;
        widget.Config.AOT = true;
        widget.Config.Position.W = 800;
        widget.Config.Position.H = 550;
        widget.Config.Actions = ['collapse', 'maximize', 'resize'];

        widget.InteractionDetails = {
            NRIC: '',
            RegNo1: '',
            InteractionID: 0,
            ConferenceType: '',
            CustomerName: avEvent?.FromAgentName || this.selectedContact.name,
            Direction: direction,
            SessionID: TUtils.Generic.uuid(),
            CallType: param
        };

        widget.Data = { ...this.config };
        widget.Data.CallType = param;
        widget.Data.Direction = direction;
        widget.Data.Source = 'InstantMessagingComponent';
        widget.Data.AgentID = avEvent?.FromAgentId || this.selectedContact.id;
        widget.Data.TmacServer = avEvent?.FromTmacServer || this.selectedContact.tmacServer;
        widget.Data.SendMessage = (jsonMessage: any) => {
            SDKClient.sendAgentAVMessage({
                jsonData: '',
                message: JSON.stringify(jsonMessage),
                toAgentId: widget.Data.AgentID,
                toTmacServer: widget.Data.TmacServer,
                type: jsonMessage.type
            });
        };

        // open call widget
        this._aotWidgetService.addWidget(widget as AOTWidget);
        // assign to the local variable
        this.callWidget = widget;
    }

    /**
     * To dispose call widget
     */
    public disposeCallWidget(): void {
        // dispose the call widget
        this.callWidget = null;
    }
}

interface WidgetData {
    /**
     * Team filter flag
     */
    TeamFilter: boolean;
    /**
     * Audio escalate allowed
     */
    AudioEscalateAllowed: boolean;
    /**
     * Video escalate allowed
     */
    VideoEscalateAllowed: boolean;
    /**
     * Screenshare allowed
     */
    ScreenShareAllowed: boolean;
}
