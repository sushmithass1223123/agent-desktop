# Widget Config

| Name                          | Component                                | Code                          | Anchor             | Static             | AOT | Maximizable        | Floatable          | Span | Comments                                         |
| ----------------------------- | ---------------------------------------- | ----------------------------- | ------------------ | ------------------ | --- | ------------------ | ------------------ | ---- | ------------------------------------------------ |
| Sample                        | TwSampleComponent                        | tw-sample                     |
| Wallboard                     | TwWallboardComponent                     | tw-wallboard                  | :heavy_check_mark: | :x:                | :x: | :x:                | :x:                | 2    |                                                  |
| Custom                        | TwCustomComponent                        | tw-custom                     | \*                 | \*                 | \*  | \*                 | \*                 | \*   | Depends on the user                              |
| Voice Panel                   | TwVoicePanelComponent                    | tw-voice-panel                | :x:                | :heavy_check_mark: | :x: | :x:                | :x:                | 2    |                                                  |
| Chat Panel                    | TwChatPanelComponent                     | tw-chat-panel                 | :x:                | :heavy_check_mark: | :x: | :x:                | :x:                | 2    |                                                  |
| Chat Controls                 | TwChatControlsComponent                  | tw-chat-controls              | :heavy_check_mark: | :x:                | :x: | :heavy_check_mark: | :x:                | 2    |                                                  |
| Heat Map                      | TwHeatMapComponent                       | tw-heat-map                   | :x:                | :x:                | :x: | :x:                | :x:                | 1    | To be removed. Similar to assiste widget         |
| Total Calls                   | TwAdTotalCallsComponent                  | tw-ad-total-calls             | :x:                | :x:                | :x: | :x:                | :x:                | 1    | To be removed . Put together in All interactions |
| Total Interactions            | TwAdTotalInteractionsComponent           | tw-ad-total-interactions      | :x:                | :x:                | :x: | :heavy_check_mark: | :heavy_check_mark: | 1    | To be removed . Put together in All interactions |
| Total AV                      | TwAdTotalAvComponent                     | tw-ad-total-av                | :heavy_check_mark: | :x:                | :x: | :x:                | :x:                | 1    | To be removed . Put together in All interactions |
| Total Chats                   | TwAdTotalChatsComponent                  | tw-ad-total-chats             | :x:                | :x:                | :x: | :x:                | :x:                | 1    | To be removed . Put together in All interactions |
| Interaction Details           | TwAdInteractionDetailsComponent          | tw-ad-interaction-details     | :x:                | :x:                | :x: | :heavy_check_mark: | :heavy_check_mark: | 2    |                                                  |
| Callbacks                     | TwAdCallbacksComponent                   | tw-ad-callbacks               | :x:                | :x:                | :x: | :heavy_check_mark: | :heavy_check_mark: | 2    |                                                  |
| Total Calls                   | TwSuTotalCallsComponent                  | tw-su-total-calls             | :x:                | :x:                | :x: | :heavy_check_mark: | :heavy_check_mark: | 2    | TBD                                              |
| Calls in Queue                | TwSuCallsInQueueComponent                | tw-su-calls-in                | :x:                | :x:                | :x: | :heavy_check_mark: | :heavy_check_mark: | 2    | TBD                                              |
| Average Handle Time           | TwSuAverageHandleTimeComponent           | tw-su-average-handle          | :x:                | :x:                | :x: | :heavy_check_mark: | :heavy_check_mark: | 2    | TBD                                              |
| Transferred Conferenced Calls | TwSuTransferredConferencedCallsComponent | tw-su-transferred-conferenced | :x:                | :x:                | :x: | :heavy_check_mark: | :heavy_check_mark: | 2    | TBD                                              |
| Channel Status                | TwSuChannelsStatusComponent              | tw-su-channels-status         | :x:                | :x:                | :x: | :heavy_check_mark: | :heavy_check_mark: | 2    |                                                  |
| Channels                      | TwSuChannelsComponent                    | tw-su-channels                | :x:                | :x:                | :x: | :heavy_check_mark: | :heavy_check_mark: | 2    | To be Removed                                    |
| Status                        | TwSuStatusComponent                      | tw-su-status                  | :x:                | :x:                | :x: | :heavy_check_mark: | :heavy_check_mark: | 2    | To Be Removed                                    |
| Voice Control                 | TwVoiceControlsComponent                 | tw-voice-controls             | :heavy_check_mark: | :x:                | :x: | :x:                | :x:                | 2    |                                                  |
| Active Agents                 | TwSuActiveAgentsComponent                | tw-su-active-agents           | :x:                | :x:                | :x: | :x:                | :x:                | 2    |                                                  |
| Work Codes                    | TwWorkCodesComponent                     | tw-work-codes                 | :x:                | :x:                | :x: | :heavy_check_mark: | :heavy_check_mark: | 2    | Add Source in data                               |
| Agent Activity                | TwSuAgentActivityComponent               | tw-su-agent-activity          | :x:                | :x:                | :x: | :heavy_check_mark: | :heavy_check_mark: | 2    | TBD                                              |
| Feedback                      | TwAdFeedbackComponent                    | tw-ad-feedback                | :x:                | :x:                | :x: | :heavy_check_mark: | :heavy_check_mark: | 1    | Maximizable view - tbd                           |
| Score                         | TwAdScoreComponent                       | tw-ad-score                   | :x:                | :x:                | :x: | :heavy_check_mark: | :heavy_check_mark: | 1    | To be removed                                    |
| Performance                   | TwAdPerformanceComponent                 | tw-ad-performance             | :x:                | :x:                | :x: | :heavy_check_mark: | :heavy_check_mark: | 1    |                                                  |
| Gamification                  | TwAdGamificationComponent                | tw-ad-gamification            | :x:                | :x:                | :x: | :heavy_check_mark: | :heavy_check_mark: | 1    |                                                  |
| Customer Journey              | TwCustomerJourneyComponent               | tw-customer-journey           | :x:                | :x:                | :x: | :heavy_check_mark: | :heavy_check_mark: | 2    |                                                  |
| Gamification                  | TwSuGamificationComponent                | tw-su-gamification            | :x:                | :x:                | :x: | :heavy_check_mark: | :heavy_check_mark: | 1    |                                                  |
| AmDocs                        | TwAmdocsBccComponent                     | tw-amdocs-bcc                 | :x:                | :x:                | :x: | :heavy_check_mark: | :heavy_check_mark: | 2    |                                                  |
| Account Info                  | TwAccountInformationComponent            | tw-account-information        | :x:                | :x:                | :x: | :heavy_check_mark: | :heavy_check_mark: | 2    |                                                  |
| Canned                        | TwCannedResponsesComponent               | tw-canned-responses           | :x:                | :x:                | :x: | :heavy_check_mark: | :heavy_check_mark: | 2    |                                                  |
| Assist                        | TwAgentAssistComponent                   | tw-agent-assist               | :x:                | :x:                | :x: | :heavy_check_mark: | :heavy_check_mark: | 2    |                                                  |
| Customer Sentiment            | TwCustomerSentimentComponent             | tw-customer-sentiment         | :x:                | :x:                | :x: | :heavy_check_mark: | :heavy_check_mark: | 2    |                                                  |

# Add to app-config.json

-   Example :

```json
{
    "Name": "Agent Assist",
    "Description": "",
    "Type": "tw-agent-assist",
    "Config": {
        "Static": false,
        "Anchor": false,
        "Icon": "verified_user",
        "Class": "",
        "Position": {
            "X": 0,
            "Y": 2
        },
        "Actions": ["maximize", "minimize", "float"],
        "ViewState": "restore",
        "PinState": false,
        "FloatState": false,
        "Resizable": false,
        "Header": true,
        "Disabled": false
    },
    "Data": {}
}
```
