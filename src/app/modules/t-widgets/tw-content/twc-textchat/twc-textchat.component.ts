import { Component, ElementRef, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWidget } from '@modules/t-widgets/utils';
import { TWLibrary } from '@twidgets/utils/widget-library/tw-library';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { IWidget, ActiveInteraction } from 'app/interfaces';
import { ContentPageService } from 'app/services/content-page.service';
import { InteractionManagerService } from 'app/services/interaction-manager.service';
import { InteractionClosedEvent, SDKClient, TextChatIncomingEvent } from 'tmac-sdk';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'twc-textchat',
    templateUrl: './twc-textchat.component.html',
    styleUrls: ['./twc-textchat.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcTextchatComponent extends TWContentWrapper implements OnInit, OnDestroy {

    @Input() data: any;

    interactions: InteractionVoiceWidgets[] = [];
    activeInteraction: number;

    constructor(
        public hostElement: ElementRef,
        public contentPageService: ContentPageService,
        private _interactionManagerService: InteractionManagerService
    ) {
        super(hostElement, contentPageService);
    }

    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // subscribe to active interaction observable
        this._interactionManagerService.activeInteraction
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe(
                (actInt: ActiveInteraction) => {
                    // check if there are textchat interactions first
                    if (this.interactions.length > 0) {
                        // filter and get the active textchat interaction if any
                        this.activeInteraction = actInt.type === 'textchat' ? actInt.interactionId : null;
                    }
                }
            );

        // listen to TMAC events
        this.registerToEvents();

        // setTimeout(() => {
        //     SDKClient.events.emit('TextChatIncomingEvent',
        //         {
        //             'IsManualAnswer': false,
        //             'UCID': 'dev200707220851_1035',
        //             'PhoneNumber': '1035',
        //             'VDNName': '49029',
        //             'CalledDevice': '49029',
        //             'Queue': '49029',
        //             'QueueName': '49029',
        //             'IsAgentTransferedChat': false,
        //             'IsAgentConferenceChat': false,
        //             'IsDeflected': false,
        //             'RecoveryData': {},
        //             'SourceAgentID': '',
        //             'SourceAgentName': 'Mohamed Siraj',
        //             'SourceTransferComment': null,
        //             'SourceAgentInteractionId': '',
        //             'ConferenceType': '',
        //             'IsNonVoiceRouting': true,
        //             'IsReCreate': false,
        //             'ChatBotFlow': null,
        //             'EventName': 'TextChatIncomingEvent',
        //             'InteractionID': 1002,
        //             'IsInteractionConstructEvent': false,
        //             'IsInteractionDisposeEvent': false,
        //             'CreatedTime': '2020-07-07T22:08:59.3023561+05:30',
        //             'EventId': 'baa83e9d-0404-4a95-a7df-2e885bdbe148',
        //             'RecoveryEvent': false,
        //             'QueuedEvent': false,
        //             'ACK': {
        //                 'IsRequired': false,
        //                 'Source': null,
        //                 'Id': null,
        //                 'Channel': null
        //             }
        //         });
        // }, 2000);

        // setTimeout(() => {
        //     SDKClient.events.emit('TextChatIncomingEvent',
        //         {
        //             'IsManualAnswer': false,
        //             'UCID': 'dev200707220851_1035',
        //             'PhoneNumber': '1035',
        //             'VDNName': '49029',
        //             'CalledDevice': '49029',
        //             'Queue': '49029',
        //             'QueueName': '49029',
        //             'IsAgentTransferedChat': false,
        //             'IsAgentConferenceChat': false,
        //             'IsDeflected': false,
        //             'RecoveryData': {},
        //             'SourceAgentID': '',
        //             'SourceAgentName': 'Mohamed Siraj',
        //             'SourceTransferComment': null,
        //             'SourceAgentInteractionId': '',
        //             'ConferenceType': '',
        //             'IsNonVoiceRouting': true,
        //             'IsReCreate': false,
        //             'ChatBotFlow': null,
        //             'EventName': 'TextChatIncomingEvent',
        //             'InteractionID': 1003,
        //             'IsInteractionConstructEvent': false,
        //             'IsInteractionDisposeEvent': false,
        //             'CreatedTime': '2020-07-07T22:08:59.3023561+05:30',
        //             'EventId': 'baa83e9d-0404-4a95-a7df-2e885bdbe148',
        //             'RecoveryEvent': false,
        //             'QueuedEvent': false,
        //             'ACK': {
        //                 'IsRequired': false,
        //                 'Source': null,
        //                 'Id': null,
        //                 'Channel': null
        //             }
        //         });
        // }, 10000);

    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    private registerToEvents(): void {
        // listen to incoming texchat event
        SDKClient.events.on('TextChatIncomingEvent', ((evt: TextChatIncomingEvent) => {
            const voiceWidgets: TWidget[] = [];
            // get the content widgets
            const widgets = this.data.Data.Widgets || [];
            // loop and get the widgets
            widgets.forEach((widget: IWidget) => {
                // add the interaction details
                widget.InteractionDetails = evt;
                // get the widget component by type
                const component = TWLibrary.getWidget(widget.Type, widget);
                // check if the component is proper
                if (component) {
                    // append the widget component to the list
                    voiceWidgets.push(component);
                }
            });
            // push the interaction details with widgets to the list
            this.interactions.push({
                interactionId: evt.InteractionID,
                widgets: voiceWidgets
            });

            // check if the first interaction then active it
            if (this.interactions.length === 1) {
                // set the active interaction
                this._interactionManagerService.activeInteraction = {
                    type: 'textchat',
                    interactionId: evt.InteractionID
                };

                // check if the textchat page is opened if not open for the first interaction
            }

            // add the construct event to the interaction manager
            this._interactionManagerService.addInteraction({
                type: 'textchat',
                interactionId: evt.InteractionID,
                status: 'incoming'
            });
        }));

        // listen to the interaction closed event and filter out the interaction
        SDKClient.events.on('InteractionClosedEvent', (evt: InteractionClosedEvent) => {
            this.interactions = this.interactions.filter((i: InteractionVoiceWidgets) => i.interactionId !== evt.InteractionID);
        });
    }
}

interface InteractionVoiceWidgets {
    interactionId: number;
    widgets: TWidget[];
}
