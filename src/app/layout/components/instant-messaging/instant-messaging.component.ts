import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren, ViewEncapsulation } from '@angular/core';
import { NgForm } from '@angular/forms';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { FusePerfectScrollbarDirective } from '@fuse/directives/fuse-perfect-scrollbar/fuse-perfect-scrollbar.directive';
import { InstantMessagingService } from 'app/layout/components/instant-messaging/instant-messaging.service';
import { groupBy, sortBy } from 'lodash';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AgentNotificaitonEvent, SDKClient } from 'tmac-sdk';

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
     * Mood
     */
    mood: string;
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
     * custom Class
     */
    class: string;
}

/**
 * Chat
 */
interface Chat {
    /**
     * Chat dialog
     */
    dialog: AgentNotificaitonEvent[];
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
    encapsulation: ViewEncapsulation.None
})
export class InstantMessagingComponent implements OnInit, AfterViewInit, OnDestroy {
    /**
     * contact List
     */
    contacts: Contact[] = [];

    /**
     * all chats
     */
    allChats: Record<string, Chat> = {};

    /**
     * agentStatus Classes
     */
    agentStatusClasses = {
        'On Call': 'do-not-disturb',
        Available: 'online'
    };

    /**
     * Current Chat
     */
    chat: Chat;
    /**
     * Selected Contact
     */
    selectedContact: Contact;
    /**
     * sidebar folded flag
     */
    sidebarFolded: boolean;
    /**
     * user
     */
    user: any;

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

    /**
     * Perfect scrollbar ref
     */
    @ViewChildren(FusePerfectScrollbarDirective)
    private _fusePerfectScrollbarDirectives: QueryList<FusePerfectScrollbarDirective>;

    // Private
    /**
     * Chat scrollbar ref
     */
    private _chatViewScrollbar: FusePerfectScrollbarDirective;
    /**
     * Unsubscribe all subject
     */
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {InstantMessagingService} _InstantMessagingService
     * @param {HttpClient} _httpClient
     * @param {FuseSidebarService} _fuseSidebarService
     */
    constructor(private _InstantMessagingService: InstantMessagingService, private _httpClient: HttpClient, private _fuseSidebarService: FuseSidebarService) {
        // Set the defaults
        this.selectedContact = null;
        this.sidebarFolded = true;

        // Set the private defaults
        this._unsubscribeAll = new Subject();
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
            .foldedChanged.pipe(takeUntil(this._unsubscribeAll))
            .subscribe((folded) => {
                this.sidebarFolded = folded;
            });
        SDKClient.events.on('TeamAgentListEvent', this.TeamAgentListEvent);
        SDKClient.events.on('AgentNotificaitonEvent', this.AgentNotificaitonEvent);
    }

    /**
     * After view init
     */
    ngAfterViewInit(): void {
        this._chatViewScrollbar = this._fusePerfectScrollbarDirectives.find((directive) => {
            return directive.elementRef.nativeElement.id === 'messages';
        });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
        SDKClient.events.off('TeamAgentListEvent', this.TeamAgentListEvent);
        SDKClient.events.off('AgentNotificaitonEvent', this.AgentNotificaitonEvent);
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
            this._replyInput?.nativeElement.focus();

            // Scroll to the bottom of the messages list
            if (this._chatViewScrollbar) {
                this._chatViewScrollbar.update();

                setTimeout(() => {
                    this._chatViewScrollbar.scrollToBottom(0);
                });
            }
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Fold the temporarily unfolded sidebar back
     */
    foldSidebarTemporarily(): void {
        this._fuseSidebarService.getSidebar('chatPanel').foldTemporarily();
    }

    /**
     * Unfold the sidebar temporarily
     */
    unfoldSidebarTemporarily(): void {
        this._fuseSidebarService.getSidebar('chatPanel').unfoldTemporarily();
    }

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
    shouldShowContactAvatar(message: AgentNotificaitonEvent, i): boolean {
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
    isFirstMessageOfGroup(message: AgentNotificaitonEvent, i): boolean {
        return i === 0 || (this.chat.dialog[i - 1] && this.chat.dialog[i - 1].FromAgentId !== message.FromAgentId);
    }

    /**
     * Check if the given message is the last message of a group
     *
     * @param message
     * @param i
     * @returns {boolean}
     */
    isLastMessageOfGroup(message: AgentNotificaitonEvent, i): boolean {
        return i === this.chat.dialog.length - 1 || (this.chat.dialog[i + 1] && this.chat.dialog[i + 1].FromAgentId !== message.FromAgentId);
    }

    /**
     * Toggle chat with the contact
     *
     * @param contact
     */
    toggleChat(contact): void {
        // If the contact equals to the selectedContact,
        // that means we will deselect the contact and
        // unload the chat

        this.contacts = this.contacts.map((x) => ({ ...x, unread: x.id === contact.id ? 0 : x.unread }));
        if (this.selectedContact && contact.id === this.selectedContact.id) {
            // Reset
            // this.resetChat();
        }
        // Otherwise, we will select the contact, open
        // the sidebar and start the chat
        else {
            // Unfold the sidebar temporarily
            this.unfoldSidebarTemporarily();

            // Set the selected contact
            this.selectedContact = contact;

            // Load the chat
            this.chat = this.allChats[contact.id] || { id: '', dialog: [] };
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
    }

    /**
     * Reply
     */
    reply(event): void {
        event.preventDefault();

        if (!this._replyForm.form.value.message) {
            return;
        }

        // Message
        const message: AgentNotificaitonEvent = {
            ...this.chat.dialog[0],
            FromAgentId: this.user.agentId,
            Message: this._replyForm.form.value.message
        };

        // Add the message to the chat
        if (!this.allChats[this.selectedContact.id]) {
            this.allChats[this.selectedContact.id] = { dialog: [], id: this.selectedContact.id };
        }

        this.allChats[this.selectedContact.id].dialog.push(message);
        this.chat = this.allChats[this.selectedContact.id];

        SDKClient.sendIM({
            message: message.Message,
            pop: false,
            toAgentId: this.selectedContact.id,
            toInteractionId: '',
            toTmacServer: this.selectedContact.tmacServer
        });

        // Reset the reply form
        this._replyForm.reset();
        this._prepareChatForReplies();
    }

    /**
     * AgentNotificaitonEvent handler
     * @param {AgentNotificaitonEvent} evt 
     */
    AgentNotificaitonEvent = (evt: AgentNotificaitonEvent): void => {
        if (evt.InteractionID > 0 || evt.Type !== 'IM') {
            return;
        }
        if (!this.allChats[evt.FromAgentId]) {
            this.allChats[evt.FromAgentId] = { dialog: [], id: evt.FromAgentId };
        }
        this.allChats[evt.FromAgentId].dialog.push(evt);
        if (evt.FromAgentId !== this.selectedContact?.id) {
            this.contacts = this.contacts.map((x) => ({ ...x, unread: x.id === evt.FromAgentId ? x.unread + 1 : x.unread }));
        } else {
            this.chat = this.allChats[evt.FromAgentId];
        }
    };

    /**
     * TeamAgentListEvent Handler
     * @param {any[]} evt 
     */
    TeamAgentListEvent = (evt: any[]): void => {
        const agents = groupBy(this.contacts, 'id');
        this.contacts = sortBy(evt, 'AgentName').map((x) => ({
            avatar: x.ProfilePicture,
            id: x.AgentLoginID,
            mood: '',
            name: x.AgentName,
            status: x.CurrentAgentStatus,
            class: this.agentStatusClasses[x.CurrentAgentStatus] || 'away',
            unread: agents[x.AgentLoginID] ? agents[x.AgentLoginID][0].unread : 0,
            tmacServer: x.TmacServer
        }));
    };
}
