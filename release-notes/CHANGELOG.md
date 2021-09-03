# Agent Desktop

## [5.0.8.30](https://git.tetherfi.com:1443/releasenotes/agent-desktop/blob/master/5.0.8.30.md)

## Changelog

### Features

-   **CustomerJourneyWidget:**
    -   Support for "LastServicedAgentName" column added to the table. `LastServicedAgentName` column added as column option for the table, and will be displayed as `Serviced Agents` in UI [see more](#customer-journey-widget-data-config-changes)
-   **EmailControlsWidget:**
    -   Emails are now downloadable [see more](#email-control-widget-data-config-changes)
    -   Skill name will be displayed instead of skill id
    -   Email attachments size is limited to max 20MB
    -   Added ability to show the priority of the email
-   **AuxStatusWidget/AgentDetailsWidget:**
    -   AUX/ACW status icons are now colored
-   **AgentSkillComponent:**
    -   Added ability to show **Speed Dial** list [see more](#agent-skill-list-component-config-changes)
    -   Placeholder is changed
-   **EmailWorkbenchWidget**
    -   Delete email feature is now configurable and will be available for a supervisor only if enabled [see more](#email-workbench-widget-data-config-changes)
-   **AuxTimerWidget**
    -   Added ability to show hours
-   **EmailTemplateSelector**
    -   Template selector menu was not shown properly

### Fixes

-   **EmailControlsWidget:**
    -   **To** and **From** value was exchanged in the email preview
    -   RouteType was not shown
    -   Editor was not loading sometimes when email pulled from the draft
    -   Interaction comments were not displayed as expected
    -   **SaveAsDraft** button was disabled when polling interval was not provided
-   **CalendarWidget:**
    -   **Change Status** task was not working as expected for PBX setup
    -   Duplicate aux codes were displayed in the dropdown when creating a task for **Change Status**
    -   Event and task reminders will have different colored dots on the calendar
-   **ChatControlswidget:**
    -   Dropdown for more action controls was not working
-   **CustomerJourneyWidget:**
    -   Large intent for an item was distorting the restored view
    -   Intent was "NA" for outbox, and now Intent will be displayed only if it exists as per the latest EMM revision
-   **InteractionDetailsWidget:**
    -   Pagination failed when navigating from one tab to another
-   **WallboardWidget:**
    -   Alignment was not shown as expected when the widget is maximized
-   **AgentSkillListComponent:**
    -   On email transfer, when the selected agent has logged out or is not in a valid state, an appropriate error message is shown
    -   Blind conference button was shown as **BT** instead of **BC**
-   **TableComponent:**
    -   Advanced search was not working as expected
-   **CreateEmailComponent:**
    -   Emails did not load tables properly
-   **PieChartComponent:**
    -   Data was not updating when the widget was maximized
-   **EmailTemplateSelectorComponent:**
    -   Loader added for template selection dropdown to indicate that network call is being made to fetch the templates
    -   Skeleton loader was not removed when no longer loading
    -   Template selector menu was not shown properly
-   **SharedWrapper:**
    -   Logger was giving the component name as "t"

### Refactor

-   **VoiceControlsWidget**
    -   Default fallback language **Mandarin** for IVR transfer is removed

### General

-   **Angular:** Updated to version 12.2.1

## Application Configuration Changes

The application configuration (developement.json/login.json/default.json) has some changes. We have added/updated few configs for different widgets/sections.

### Main section changes

#### Customer Journey Widget Data config changes

-   Added a new option `LastServicedAgentName` under **Columns** list property

```json
    "Data": {
        "Columns": [
            "LastServicedAgentName"
        ]
    }
```

#### Email Control Widget Data config changes

-   Added a new config `DownloadAllowed` to allow/not allow the user to download the email

```json
    "Data": {
        "DownloadAllowed": false
    }
```

-   Config definitions:
    -   **DownloadAllowed** - [NEW] Accepts boolean value true or false, default is false

#### Email Workbench Widget Data config changes

-   Added a new config `DeleteAllowed` to allow/not allow user (supervisor) to delete the emails

```json
    "Data": {
        "DeleteAllowed": false
    }
```

-   Config definitions:
    -   **DeleteAllowed** - [NEW] Accepts boolean value true or false, default is false

#### Agent Skill List Component config changes

-   Added ability to configure **Speed Dial** list for make call/transfer/conference
-   Today **Speed Dial** list will be supported only for Make Call and Voice Transfer/Conference

##### Create Interaction Widget Data config changes

In Create Interaction Widget for **Make Call** section we used to support only **Agent** before. Now **Speed Dial** list can be configured as given below.

```json
    "Data": {
        "Channels":[
            {
                "Name": "Make Call",
                "Enabled": true,
                "EnableState": "calloutbound",
                "Type": "voice",
                "SubType": "voice",
                "Icon": "call",
                "Data": {
                    "Agent": {
                        "Source": {
                            "Use": "station",
                            "Display": "${LastName}, ${FirstName}",
                            "FreeTextAllowed": true
                        },
                        "AllowedStates": [],
                        "TeamFilter": false,
                        "Columns": []
                    },
                    "SpeedDial": {
                        "Allowed": true,
                        "Source": {
                            "Use": "Number",
                            "Display": "${Name} - ${Number}",
                            "FreeTextAllowed": true

                        "Columns": [],
                        "TeamFilter": true
                    }
                }
            },
        ]
    }
```

> **NOTE:** Previously we used to have only "Agent" section, so the **Data** section was having whatever inside the `Agent` section now. There is a change in JSON structure to support `Speed Dial`, However previous JSON structure is still supported and will have only the `Agent` section in **Make Call** popup

##### Voice Control Widget Data config changes

```json
    "Data": {
        "Transfer":{
            "Agent": {},
            "Skill": {},
            "SpeedDial": {
                "Allowed": true,
                "Consult": true,
                "Blind": true,
                "Comments": false,
                "Source": {
                    "Use": "Number",
                    "Display": "Number",
                    "FreeTextAllowed": true
                },
                "Columns": []
            },
        }
    }
```

-   Same section will be followed for **Conference** section as well
-   Config definitions:
    -   **Allowed:** Speed Dial list allowed flag, Accepts boolean value true or false
    -   **Consult:** Consult Transfer/Conference allowed flag [Applicable only for Transfer and Conference], Accepts boolean value true or false
    -   **Blind:** Blind Transfer/Conference allowed flag [Applicable only for Transfer and Conference], Accepts boolean value true or false
    -   **Comments:** Comments allowed for Transfer/Conference [Applicable only for Transfer and Conference], Accepts boolean value true or false
    -   **Use:** Property to use to take action. Since Speed Dial list has only "Number" only number will be used when selected from the grid
    -   **Display:** Display in textbox when selected from the grid, this can be changed however the user wants
    -   **FreeTextAllowed:** Free text allowed flag, Accepts boolean value true or false
    -   **Columns:** Columns to show, If empty all the columns will be showed. "Name" | "Number" are the expected values
    -   **TeamFilter:** Team filter flag, If true the Speed Dial List will be loaded for the user's team only which is configured in OCM, Accepts boolean value true or false

> **NOTE:** We have moved the additional information and other sections to [README](https://git.tetherfi.com:1443/releasenotes/agent-desktop/blob/master/README.md).

## [5.0.7.30](https://git.tetherfi.com:1443/releasenotes/agent-desktop/blob/master/5.0.7.30.md)

## Changelog

### Features

-   **EmailControlsWidget:**
    -   **Mark As Spam** button is available all the time now, and the user is notified if the email is probably spam
    -   Raw HTML display support in creating and preview email
-   **EmailWorkbenchWidget:**
    -   Added notification when emails are closed
-   **AgentAssistWidget:**
    -   Any interaction data (i.e., Interaction.\*) and agent data (i.e., AgentData.\*) can be used in URL config
-   **CustomerJourneyWidget:**
    -   Session History can now be opened in a new tab
-   **CustomWidgets:**
    -   Now accepts post message to show snack bar
    -   Now accepts post message to show and hide confirm dialog
-   **TCISIntegrationWidget:**
    -   Added a new config "Channel" in "Data.Actions" to trigger an action on the same event for different channel [see more](#tcis-integration-widget-data-config-changes)
    -   Action parameter value for TMACEvent now support stringified event property value
-   **CustomerDetailsWidget:**
    -   CustomerInfo config property value 'ValueSource' no longer needed 'JsonParse' to get value from a stringified event property [see more](#customer-details-widget-data-config-changes)
-   **AgentDetailsWidget:**
    -   Added a new config "DefaultLogout" in "Data.AuxCodes.DefaultLogout" to enable the default Logout status from server [see more](#agent-details-widget-data-config-changes)
    -   Added a new config "DefaultACW" in "Data.AuxCodes.DefaultACW" to enable the default ACW status from the server which allows users to change to ACW manually during an interaction [see more](#agent-details-widget-data-config-changes)
-   **LogoutWidget:**
    -   Added a new config "AllowLogoutOnOpenInteractions" to allow/not allow user to logout on open interaction [see more](#logout-widget-data-config-changes)
-   **SkeletonLoaderComponent:**
    -   Added a loader for EmailWorkbenchWidget and PreviewEmailComponent

### Performance

-   **EmailControlsWidget:**
    -   Only when pulled from the draft, the email will be deleted from the draft on send

### HotFixes

-   **EmailControlsWidget:**
    -   Save as draft was disabled when polling was disabled
    -   Disabling saving as a draft while sending email
-   **AgentSkillWidget:**
    -   When selecting an agent who has logged out after loading the list, the error message shown was wrong
-   **EmailWorkbenchWidget:**
    -   Disabled polling on workbench destroyed

### Fixes

-   **AOTWidgets:**
    -   Disabled opening of duplicate AOT widgets
-   **EmailControlsWidget:**
    -   Email draft pull was not deleting the pulled item on sending the email
    -   Draft was saved with multiple OutboxSessionIDs
    -   "To" field does not populate all email ids when "Reply All" clicked
    -   Sent, Drafts email when pulled was not showing correct "To" List
    -   Bulk selection was enabled for sent items
    -   "Priority" spelling was wrong
-   **EmailWorkbenchWidget:**
    -   Sent email items pull was not working
-   **ChatControlsWidget:**
    -   Message with line break was not displayed properly
-   **SuAgentInteractionsWidget:**
    -   Barge-in buttons were enabled for disconnected chats
-   **UserLocationWidget:**
    -   Map was not covering the full widget
-   **LoginPage:**
    -   Domain name was always sent as "item"
-   **InteractionDetailsWidget:**
    -   JSON string shows up in the advanced search dialog
    -   Pagination, Sort was not working
    -   "Intent" was missing in the advanced search
-   **WorkCodeWidget:**
    -   Group header work code was shown when 'ByGroup' was false in the config
-   **CalendarWidget:**
    -   Unable to add an event when the date was changed and was valid
    -   Primary and secondary color disabled from new event/task form
-   **CustomerJourneyWidget:**
    -   Channel tooltip was overlapping
    -   Chat transcript was showing as expected
    -   Chat transcript button was enabled for an email item
-   **SupervisorActiveAgentsWidget:**
    -   Get activity of the agent in different TMAC Server was not working
    -   Changing the status of an agent in a different TMAC Server was not working
-   **PreviewEmailComponent:**
    -   Long Attachment Names were overflowing
-   **InstantMessagingComponent:**
    -   Fixed few issues related to agent status
-   **TCISIntegrationWidget:**
    -   SignalR connection will be closed when the component is destroyed
-   Sending agent activity for the request from supervisor in different TMAC Server was not working

### General

-   Latest EMM server integrations
-   Color changes for few components to have consistency
-   Removed animation on setting button which was causing the bouncing issue in some resolution
-   Updated AV SDK to version 1.1.3.19

## Application Configuration Changes

The application configuration (developement.json/login.json/default.json) has some changes. We have added/updated few configs for different widgets/sections.

### `Main` section changes

#### TCIS Integration Widget `Data` config changes

Added a new config `Channel` under **Action** list property to control actions based on channel

```
"Data": {
    ...
    "Actions": [
        {
            "EventName": "",
            "Channel": "chat", // [NEW] Accepts 'voice' | 'chat' | 'email' | 'fax' | 'sms' | 'generic'
            "Parameters": [],
            "Method": "",
            "ExeName": ""
        }
    ]
}
```

#### Customer Details Widget `Data` config changes

CustomerInfo config property value 'ValueSource' no longer needed 'JsonParse' to get value from a stringified event property

```
"Data":{
    ...
    "CustomerInfo": [
        {
            "Title": "Channel",
            "ValueSource": "JsonParse(TextChatRemoteUserConnectedEvent.JsonData).pChannel", // [DEPRICATED] format
            "ValueSource": "TextChatRemoteUserConnectedEvent.JsonData.pChannel", // [NEW] format
            "Unit": "",
            "DefaultValue": ""
        }
    ]
}
```

#### Agent Details Widget `Data` config changes

-   Added a new config `DefaultLogout` to enable the default Logout status from the server
-   Added a new config `DefaultACW` to enable the default ACW status from the server which allows users to change to ACW manually during an interaction (**On Call** status)

```
"Data": {
    ...
    "AuxCodes": {
        "Enabled": true,
        "ByTeam": true,
        "DefaultACW": false, // [NEW] Accepts boolean value true or false, default is false
        "DefaultLogout": false // [NEW] Accepts boolean value true or false, default is false
    }
}
```

#### Logout Widget `Data` config changes

-   Added a new config `AllowLogoutOnOpenInteractions` to allow/not allow user to logout on open interaction

```
"Data": {
    "LogoutAux": "logout",
    "AllowLogoutOnOpenInteractions": false // [NEW] Accepts boolean value true or false, default is true
}
```

> **NOTE:** We have moved the additional information and other sections to [README](https://git.tetherfi.com:1443/releasenotes/agent-desktop/blob/master/README.md).

## [5.0.6.3001](https://git.tetherfi.com:1443/releasenotes/agent-desktop/blob/master/5.0.6.3001.md)

## Changelog

### Hot Fixes

-   **Interaction Details Widget:** Paginator was not working issue fixed `🛠`
-   Instant Messaging Component: The UI gets misaligned when clicked on new IM notification issue fixed `🛠`
-   Agent Skill List Component: Consult transfer/conference button was missing for skills after adding new config feature issue fixed `🛠`

## [5.0.6.30](https://git.tetherfi.com:1443/releasenotes/agent-desktop/blob/master/5.0.6.30.md)

## Changelog

### Enhancement / Fixes

-   **EmailControlsWidget:** Added scrollbar styles to iframe
-   **EmailControlsWidget:** Added confirmation popup to save email as draft when closing compose/reply
-   **EmailControlsWidget:** Sent and Draft Emails when pulled, had interchanged for 'To' and 'From' issue fixed `🔨`
-   **EmailControlsWidget:** Sending Email loader replaced from progress-bar to toast
-   **EmailControlsWidget:** Draft was saved multiple times issue fixed `🔨`
-   **EmailControlsWidget:** Email send response from the server for 'Email Scheduled' message changed to success message
-   **EmailControlsWidget:** Changes in layout
-   **EmailWorkbenchWidget:** Emails were loaded by default in ascending order of time, changed descending to show latest first
-   **EmailWorkbenchWidget:** Bulk operations button was rendering even when no emails available issue fixed `🔨`
-   **EmailWorkbenchWidget:** Added Select All option
-   **EmailWorkbenchWidget:** Global and Advanced searches now work in unison
-   **EmailWorkbenchWidget:** Added separate advance search for each folder
-   **EmailWorkbenchWidget:** No indication as to whether the advance search is active or not issue fixed `🔨`
-   **EmailWorkbenchWidget:** Last attachment was not displayed in email preview issue fixed `🔨`
-   **EmailWorkbenchWidget:** Advance search radio button filters were not working issue fixed `🔨`
-   **EmailWorkbenchWidget:** Bulk deletion for inbox was missing issue fixed `🔨`
-   **EmailWorkbenchWidget:** SortBy was not working as expected issue fixed `🔨`
-   **EmailWorkbenchWidget:** Global key search when cleared was not working as expected issue fixed `🔨`
-   **VoiceControlsWidget:** Added new config **CloseInteractionOnEnd** to close interaction on call end ([see more](#voice-controls-widget-data-config-changes))
-   **ChatControlsWidget:** Chat action icons are re-organized
-   **ChatControlsWidget:** Added new config **CloseInteractionOnEnd** to close interaction on chat end ([see more](#chat-controls-widget-data-config-changes))
-   **ChatControlsWidget:** Added new config **EndInteractionOnAVEnd** to end chat on AV disconnect ([see more](#chat-controls-widget-data-config-changes))
-   **ChatControlsWidget:** Removed unused config properties **AskForScreenshareAllowed** and **InteractionConversion** ([see more](#chat-controls-widget-data-config-changes))
-   **ChatControlsWidget:** Added new feature to resend failed messages
-   **ChatControlsWidget:** Basic async chat integration `beta`
-   **WorkbenchPanelWidget:** Added new config to enable channels ([see more](#workbench-panel-widget-data-config-changes))
-   **WorkbenchPanelWidget:** Added new config **QueueTransferForAgent** to allow queue transfer for agents ([see more](#workbench-panel-widget-data-config-changes))
-   **InteractionDetailsWidget:** Advance Search wasn't working issue fixed `🔨`
-   **CalendarWidget:** Reminder logic was not working as expected issue fixed `🔨`
-   **CustomerJourneyWidget:** Chat transcripts time format changed
-   **WorkcodesWidget:** Workcodes ByGroup filter issue fixed `🔨`
-   AgentSkillComponent: Added new configs `Consult` to check for consult and `Comment` to allow comments ([see more](#agent-skill-component-config-changes))
-   AgentSkillComponent: Blind transfer button was enabled even if it is configured as false issue fixed `🔨`
-   SidebarComponent: InstantMessagingWidget was leaving a white space when opened via notification issue fixed `🔨`
-   CreateEmailComponent: Email Id suggestion was not working as expected issue fixed `🔨`
-   PreviewEmailComponent: Longer subjects were not visible issue fixed `🔨`
-   ReminderComponent: Added snooze timer for task reminders
-   Voice call blind transfer logic changed
-   Angular updated to 12.1.0
-   Upgraded dependency packages

### Migrating to 5.0.6.30 ([see more](#sdk-config-changes))

-   **Configuration:** AppConfigs.SDK: CustomScripts spelling mistake issue fixed `🔨`
-   **Configuration:** AppConfigs.SDK: Config casing changed to the camel casing to directly support for TMAC SDK (Existing pascal casing will be support for fewer releases)

## Application Configuration Changes

The application configuration (developement.json/login.json/default.json) has some changes. We have added few more configs for different functionalities.

### `Main` section changes

#### Voice Controls Widget `Data` config changes

Added new config `CloseInteractionOnEnd` to close voice interaction on disconenct

```
"Data":{
    ...,
    "CloseInteractionOnEnd": false // [NEW] Accepts boolean value true or false
}
```

#### Chat Controls Widget `Data` config changes

-   Added new config `CloseInteractionOnEnd` to close chat interaction on disconenct
-   Added new config `EndInteractionOnAVEnd` to end chat on AV disconnect
-   Removed unused config properties `InteractionConversion` and `AskForScreenshareAllowed`

```
"Data":{
    ...,
    "InteractionConversion": [], --> DEPRICATED
    "AskForScreenshareAllowed": false, --> DEPRICATED

    "EndInteractionOnAVEnd": false // [NEW] Accepts boolean value true or false
    "CloseInteractionOnEnd": false // [NEW] Accepts boolean value true or false
}
```

#### Workbench Panel Widget `Data` config changes

-   Added new config `Enabled` for both Email and Chat channel to enable/disable channel panel
-   Added new config `QueueTransferForAgent` under Email channel to allow the agent to transfer emails from the queue

```
"Data": {
    "Channels": [
      {
        "Type": "Email",
        "Enabled": true, // [NEW] Accepts boolean value true or false
        "Icon": "email",
        "Config": {
            ...,
            "QueueTransferForAgent": false // [NEW] Accepts boolean value true or false
        }
    },
    {
        "Type": "Chat",
        "Enabled": true, // [NEW] Accepts boolean value true or false
        "Icon": "chat",
        "Config": {
            ...
        }
    }
  ]
}
```

#### Agent Skill Component config changes

-   Added new config `Consult` to allow consult transfer/conference for different channels
-   Added new config `Comments` to allow comments when transfer/conference for different channels. Comments funtionality is not support on all channels

```
"Transfer": {
    "Agent": {
        "Allowed": true,
        "Consult": true, // [NEW] Accepts boolean value true or false, default is true
        "Blind": true,
        "Comments": true, // [NEW] Accepts boolean value true or false, default is false
        "Source": {},
        ...
    },
    "Skill": {
        "Allowed": true,
        "Consult": true, // [NEW] Accepts boolean value true or false, default is true
        "Blind": true,
        "Comments": true, // [NEW] Accepts boolean value true or false, default is false
        "Source": {},
        ...
    }
}
```

> **NOTE**: This config is available in widget **Data** of `tw-voice-controls`, `tw-chat-controls`, `tw-email-controls` and `tw-workbench-panel` (for email channel).

### `AppConfigs` section changes

#### `SDK` config changes

-   `CustomScripts`spelling changed from **CustomSripts**

```
{
    "AppConfigs": {
        "SDK": {
            ...,
            "CustomScripts": [] // [FIX] Spelling mistake issue fixed
        }
    }
}
```

-   Casing changed to the camel casing to directly support for TMAC SDK

```
{
    "AppConfigs":{
        "SDK": {
            "proxy": {
                "urls": [],
                "type": "soap",
                "timeout": 60
            },
            "signalRProxy": {
                "enabled": true,
                "logging": true,
                "protocol": "webSockets",
                "timeout": 10,
                "fallback": true
            },
            "logging": {
                "enabled": true,
                "level": {
                    "debug": true,
                    "info": true,
                    "warn": true,
                    "error": true
                },
                "remote": {
                    "enabled": true,
                    "timeout": 30,
                    "count": 30
                },
                "sdkMethods": true,
                "sdkEvents": true
            },
            "customScripts": []
        }
    }
}
```

> **NOTE**: There is no change in the config key except the casing is changed to camel casing. The app will still support the existing casing for a few more releases to have backward compatibility. If the existing case is used, please make sure to change the spelling issue fix for `CustomScripts` property.

## [5.0.6.1801](https://git.tetherfi.com:1443/releasenotes/agent-desktop/blob/master/5.0.6.1801.md)

## Changelog

### Hot Fixes

-   **Customer Journey Widget:** When some colums were removed, table columns were not aligned properly issue fixed `🛠`
-   **Email Workbench:** Some of the fields like (Replied Status, Closed Status, Priority , Agent Name etc) does not get value from API, so it is removed from UI
-   **Active Interaction Widget:** When multiple interaction are added, **Toolbar Menu Widget** elements were going out of view issue fixed (added scrollbar) `🛠`
-   In a Widget config, the Class property when 'mx-cover' class was added, the widget was not expanding to 100% when a widget was maximized issue fixed `🛠`

### Enhancements / Fixes

-   **Email Controls Widget:** The html block format in the editor is removed `🛠`
-   **Email Controls Widget** Email body wasnt loading properly in innerHtml issue fixed (now loads as iframe) `🛠`
-   **Email Controls Widget** RouteId was missing while sending emails issue fixed `🛠`
-   **Customer Journey Widget:** Email preview didnt have a loader issue fixed `🛠`
-   **Customer Journey Widget:** Expanded row close button was not visible for email channel issue fixed `🛠`
-   **Customer Journey Widget:** Comments saved by the one agent was visible to others issue fixed `🛠`
-   **Customer Journey Widget:** Minor UI improvements
-   **Email Workbench:** Emails in were not sorting properly for **Subject** sort issue fixed `🛠`
-   **Email Workbench:** Queue searches subjects only, we so changed the global placeholder **Search** to **Search by Subject**
-   **Email Workbench:** When tab changed, email folders with same names were preserved issue fixed `🛠`
-   Higher number of attachments were not visible in email preview issue fixed `🛠`
-   Email content preview which has table was not showing properly issue fixed `🛠`

## [5.0.6.18](https://git.tetherfi.com:1443/releasenotes/agent-desktop/blob/master/5.0.6.18.md)

## Changelog

### Features

-   **Customer Details Widget:** Feature added to mask customer information ([see more](#customer-details-widget-data-config-changes))
-   **Voice Control Widget:** Make Call and Send SMS feature added ([see more](#voice-control-widget-data-config-changes))
-   Added new `theme-cyan-orange` pair light theme ([see more](https://git.tetherfi.com:1443/releasenotes/agent-desktop#ad-theming))
-   Added new widget `Compose Messaging Widget` to send SMS/WhatsApp messages using OCM SMS templates ([see more](#new-compose-messaging-widget))
-   Feature to preview widgets locally using `preview.json` and by providing query param **templateName=local** in (/preview) page
-   Added AD widget config definition section in release notes ([see more](https://git.tetherfi.com:1443/releasenotes/agent-desktop#ad-widget-config-definition))
-   Added AD theming section in release notes ([see more](https://git.tetherfi.com:1443/releasenotes/agent-desktop#ad-theming))

### Enhancement / Fixes

-   **Callback Dashboard Widget:** Added callbacks filtering functionaility on click of 'Handled', 'Pending' or 'Missed'
-   **Callback Dashboard Widget:** Logic changed for callbacks 'Handled'
-   **Interaction Details Widget:** Added missing channel names (AudioChat and VideoChat)
-   **Aht Tc Widget:** Channel icon changes
-   **Interaction Details Widget:** channel/subchannel icon changes
-   **Interaction Details Widget:** Moved agent comments to a popup for better visibility
-   **Campaign Contact Widget:** Major improvements in UI and logics `beta`
-   **Custom Widget:** Added name attribute to iframe tag to identify the iframe when a post message is received
-   **Custom Widget:** Events emitted to iframes is filtered, only necessary event will be sent
-   **Customer Details Widget:** Improvements in UI
-   **Customer Journey Widget:** Default channel icon is changed to 'feed' ([see more](https://fonts.google.com/icons?selected=Material+Icons:feed))
-   **Customer Journey Widget:** Default channel was shown as 'Chat' for timeline issue fixed `🛠`
-   **Customer Journey Widget:** Added tooltips for data
-   **Customer Journey Widget:** Improvements in showing agent comments and interaction actions
-   **Customer Journey Widget:** Channel icon changes
-   **Customer Journey Widget:** Added **Direction** and **Email** columns
-   **Customer Journey Widget:** Table columns are now configurable ([see more](#customer-journey-widget-data-config-changes))
-   **Customer Journey Widget:** Only the columns configured will be available in advance search
-   **Customer Journey Widget:** Interaction date column sorting issue fixed `🛠`
-   **Pending Callbacks Widget:** Data config **TCMProxyUrl** property's value changed ([see more](#pending-callbacks-widget-data-config-changes))
-   **Supervisor Active Agents Widget:** Added appropriate messages when a supervisor change the status of an agent who is 'On Call'
-   **Supervisor Active Agents Widget:** Added functionality to have OCM agent feature to enable set broadcast message feature for a supervisor ([see more](#canned-responses-widget-data-config-changes))
-   **Docker Widget:** Alignment issue fixed `🛠`
-   **Email Control Widget:** Confirmation will be shown before sending an email without subject
-   **Email Control Widget:** "RE:" was added to all replied emails repeatedly issue fixed `🛠`
-   **Email Control Widget:** Enhanced to auto select new outgoing or pulled email interaction tab
-   **Email Control Widget:** Editor toolbar was not showing in chrome issue fixed `🛠`
-   **Chat Control Widget:** Typing indicator is added when customer or conferenced agent is typing
-   **Chat Control Widget:** Enhanced to auto select new interaction tab if old interactions are not active
-   **Email Workbench:** "From" was not showing in workbench email preview
-   **Email Workbench:** Editor was not loading sometimes in email bulk reply issue fixed `🛠`
-   **Email Workbench:** Draft was saving multiple copies issue fixed `🛠`
-   **Email Workbench:** Data polling is moved to background action
-   **Email Workbench:** Advanced search was not closing when switching tabs issues fixed `🛠`
-   **Email Workbench:** Select All option for queue and draft category
-   **Active Interaction Widget:** When multiple interaction are added, **Toolbar Menu Widget** elements were going out of view issue fixed (added scrollbar) `🛠`
-   **Calendar Widget:** Add event/task pop was showing page loaded time in time picker instead of pop-up opened time issue fixed `🛠`
-   **Canned Responses Widget:** Added new config `EditAllowed` to allow users to edit selected template ([see more](#canned-responses-widget-data-config-changes))
-   **Canned Responses Widget:** Added new config `ResponseMode` to set initial response mode for template selection ([see more](#canned-responses-widget-data-config-changes))
-   **Home/Supervisor widget:** Added maximum date filter for 90 days
-   **Pie Chats Widget:** Duration format changed to HH:mm:ss
-   Added a new config **RouteOnInteraction** to `Voice/Textchat/Email/Generic` widgets to allow navigating and selecting particular interaction tab on new interaction ([see more](#supervisor-active-agents-widget-to-support-agent-feature-to-set-broadcast-message))
-   Added logic to process **AutoCloseTabEvent**
-   **InteractionClosedEvent** logic enhanced
-   Updated Workbench API integration
-   Make Call success message was not showing proper message issue fixed `🛠`
-   Added appropriate message to Transfer/Conference Call success message
-   Default font of the app changed to Muli
-   Added 'name' property to IPostMessage interface ([see more](https://git.tetherfi.com:1443/releasenotes/agent-desktop#to-send-post-message-to-ad))
-   Imprivements in `Widget Preview` UI
-   Added new `preview.json` file for local widgets preview
-   In a Widget config, the `Class` property when 'cover' or 'mx-cover' class was added, the widget was not expanding to 100% when a widget was maximized issue fixed `🛠`
-   Removed pinning widget feature temporarily
-   Major improvements in `TMAC Events` handling mechanism
-   **OnNLPDataEvent** was not handled properly issue fixed `🛠`
-   Added appropriate messages for email send errors
-   Added AD version and TMAC Server version in application info popup
-   AOT widgets and other widgets will support custom icons ([see more](https://git.tetherfi.com:1443/releasenotes/agent-desktop#ad-custom-icons))
-   Calendar Add Event and AOT button's color is changed to the theme's **accent** color
-   Voice and Chat interaction comment button will be blinking if there is a new interaction with transfer or interaction comments
-   When snoozing Meeting Task and Make Call Task reminder were not working issue fixed `🛠`
-   Added browser notifications for reminders and application alerts
-   Other minor issue fixes and enhancements

## Application Configuration Changes

The application configuration (developement.json/login.json/default.json) has some changes. We have added few more configs for different functionalities.

### `Main` section changes

#### New `Compose Messaging Widget`

We have added a new widget `Compose Messaging Widget` to send SMS/WhatsApp message by selecting a SMS template configured in OCM.

##### Data Config:

-   `Type`: Channel of compose, accept string value "sms" or "whatsapp"
-   `Number`: TMAC event property can be configured to take default value to send SMS

Widget config is given below:

```
{
    "Name": "Compose Messaging",
    "Description": "",
    "Key": "ComposeMessaging",
    "Type": "tw-compose-messaging",
    "Config": {
        "Enabled": true,
        "Hidden": false,
        "Static": false,
        "Anchor": true,
        "AOT": false,
        "AutoOpen": false,
        "Icon": "sms",
        "Class": "",
        "Position": {
            "X": 2,
            "Y": 2
        },
        "Actions": [
            "maximize",
            "float"
        ],
        "ViewState": "restore",
        "Header": true,
        "Pinned": false
    },
    "Data": {
        "Type": "sms", // Channel of compose, accepts string value "sms" or "whatsapp"
        "Number": "CCLDataEvent.RegisteredPhone" // TMAC event property can be configured to take default to send SMS
    }
}
```

#### Voice/Textchat/Email/Generic Widget `Data` config changes

Added new config `RouteOnInteraction` to `twc-voice`, `twc-textchat`, `twc-email` and `twc-generic` widgets to allow navigating and selecting interaction tab on new interaction.

```
{
    "Main": {
        "Content": {
            "Widgets": [
                ...
                {
                    ...
                    "Type": "twc-voice",
                    ...
                    "Data": {
                        "Path": "/voice",
                        "RouteOnInteraction": true, // Accepts boolean value true or false, default is true
                        ...
                    }
                },
                {
                    ...
                    "Type": "twc-textchat",
                    ...
                    "Data": {
                        "Path": "/textchat",
                        "RouteOnInteraction": true, // Accepts boolean value true or false, default is true
                        ...
                    }
                },
                {
                    ...
                    "Type": "twc-email",
                    ...
                    "Data": {
                        "Path": "/email",
                        "RouteOnInteraction": true, // Accepts boolean value true or false, default is false
                        ...
                    }
                },
                {
                    ...
                    "Type": "twc-generic",
                    ...
                    "Data": {
                        "Path": "/generic",
                        "RouteOnInteraction": true, // Accepts boolean value true or false, default is false
                        ...
                    }
                }
                ...
            ]
        }
        ...
    }
}
```

> **NOTE**: The default value of this config will be true for `voice` and `textchat` since they are realtime interaction, so you can configure to set as false to disable navigating and selecting on new interaction. For `email` and `generic` this config should be added and configured as `true` so that when on new interaction those channel's tab will be auto selected.

#### Customer Details Widget `Data` config changes

-   Added new property `MaskData` under existing **CustomerInfo** array object property to support masking of customer information.
    MaskData Config example:
    ```
    "Data": {
        "CustomerInfo": [
            {
                Title": "Mobile",
                "ValueSource": "CCLDataEvent.RegisteredPhone",
                "Unit": "",
                "DefaultValue": "123456789",
                "MaskData": { // New config added
                    MaskWith: "*", // A symbol for masking [Default: *]
                    MaxMaskedChars: "", // Limits the output string length [Default: 16]
                    UnMaskedStartChars: "", // First N symbols that will not be masked [Default: N]
                    UnMaskedEndChars: "" // Last N symbols that will not be masked [Default: N]
                }
            }
            ...
        ]
    }
    ```
-   `MaskData` config property will accept boolean value as well which will use default config
    E.g.: value [123456789] will be [*********] for the following:
    ```
    {
         Title": "Mobile",
        "ValueSource": "CCLDataEvent.RegisteredPhone",
        "Unit": "",
        "DefaultValue": "123456789",
        "MaskData": true
    }
    ```
-   `MaskData` config property will accept partial object value as well and the rest of the config will be default values
    E.g.1: value [123456789] will be [#########] for the following:
    ```
    {
        Title": "Mobile",
        "ValueSource": "CCLDataEvent.RegisteredPhone",
        "Unit": "",
        "DefaultValue": "123456789",
        "MaskData": {
            MaskWith: "#"
        }
    }
    ```
    E.g.2: value [123456789] will be [123****89] for the following:
    ```
    {
        Title": "Mobile",
        "ValueSource": "CCLDataEvent.RegisteredPhone",
        "Unit": "",
        "DefaultValue": "123456789",
        "MaskData": {
            "UnMaskedStartChars": "3",
            "UnMaskedStartChars": "2"
        }
    }
    ```
    > **NOTE**: If this config is not added, by default `MaskData` will be false for all configured customer details config

#### Voice Control Widget `Data` config changes

Added new configs `MakeCallAllowed` to make call from existing voice interaction tab which will take default number as incoming number and `SendSMSAllowed` to send SMS from existing voice interaction tab which will take default number as incoming number and user can select template which is configured in OCM to send SMS.

```
"Data": {
    ...
    "MakeCallAllowed": true, // Accepts boolean value true or false
    "SendSMSAllowed": true // Accepts boolean value true or false
}
```

#### Customer Journey Widget `Data` config changes

Added new config `Columns` to configure columns for `Customer Journey Widget` table. Same config will be used in Advance Search so that the columns and Advance Search form will be similar.

```
"Data": {
    ...
    "Columns": [
        "InteractionDate", // Interaction received date
        "Channel", // Channel of intereraction
        "Direction", // Direction of interaction (IN or OUT)
        "InteractionText", // Interaction text
        "Intent", // Intent of interaction
        "AgentName", // Name and user Id of the agent who handled the interaction
        "CIF", // CIF of customer
        "NRIC", // NRIC of customer
        "PhoneNumber", // Phone number of customer
        "EmailID", // Email Id of customer
        "OverallSentiment", // Overall sentiment of customer [beta]
        "Actions" // Action buttons to perform
    ]
}
```

> **NOTE**: You can add or remove any of these values anytime based on user preference but please note the values are `CASE SENSITIVE` so the value should be given same as above for each column.

#### Pending Callbacks Widget `Data` config changes

Existing config **TCMProxyUrl** value has been changed. There is a small update done to support multiple versions of APIs. The existing config was not accepting `/api` in the value. From this version onward as given below the value of **TCMProxyUrl** must have `/api`.

```
"Data": {
    "TCMProxyUrl": "https://<server-ip>/TCM_Proxy" // Depricated value
    "TCMProxyUrl": "https://<server-ip>/TCM_Proxy/api", // New value which has '/api' at the end
    ...
}
```

#### Canned Responses Widget `Data` config changes

Added new configs `EditAllowed` to allow user to edit selected template and `ResponseMode` to set initial response mode for template selection.

```
"Data": {
    ...
    "EditAllowed": true, // Accepts boolean value true or false
    "ResponseMode": "auto" // Accepts string value "auto" or "manual"
}
```

## [5.0.5.30](https://git.tetherfi.com:1443/releasenotes/agent-desktop/blob/master/5.0.5.30.md)

## Changelog

### Features

-   Email Channel: Compose new email feature added. Agent can select the mailbox from a list and compose new email.
-   Installation and Configuration: AD is now compatible with TMC installer ([see more](https://git.tetherfi.com:1443/releasenotes/agent-desktop#ad-tmc-installer-integration))
-   Authentication: AD is now compatible with IIS Windows Authentication ([see more](https://git.tetherfi.com:1443/releasenotes/agent-desktop#ad-windows-authentication))
-   Email Channel: Email editor package changed from quill to tinyMCE for better html display conversion from client to AD
-   Email Channel: Email Workbench Panel is now responsive.
-   Email Channel: Email workbench queue tab allows deleting emails
-   Video Call: 'One Way Video' feature to disable video on agent side during a video call
-   Video Call: 'One Way Video' can be upgraded to 'Two Way Video' in realtime

### Enhancement / Fixes

-   Instant Message (IM) widget was not clearing the selected agent when closing the panel issue fixed `🛠`
-   Added AD UI version in version section in login page (previous version was only showing the TMAC server version)
-   Setting the theme of login page based on config received from login json file
-   AOT Float Action Button (FAB) was not closing on clicking outside issue fixed `🛠`
-   AOT FAB button was getting clicked when dragging issue fixed `🛠`
-   Customer Journey Widget gird sorting issue fixed `🛠`
-   Customer Journey Widget chat transcript was showing object for json message issue fixed `🛠`
-   Customer Journey Widget chat transcript was not in correct order issue fixed `🛠`
-   Customer Journey Widget chat transcript was not showing snapshot issue fixed `🛠`
-   Customer Journey Widget email preview was not working issue fixed `🛠`
-   Customer Journey Widget pagination was not working issue fixed `🛠`
-   Customer Journey Widget when maximised view was showing table even when 'no data available' issue fixed `🛠`
-   Video Call Widget when 3 videos were shown the UI alignment was not proper issue fixed `🛠`
-   Home and Supervisor Content Widget, added current date in dashboard date selection calendar
-   Home and Supervisor Content Widget, added vertical dragging for date selection
-   When a widget is maximized in collapsed state it was still in collapsed state issue fixed `🛠`
-   When there is counter for chats if we navigate to the chats from navbar it was not getting cleared issue fixed `🛠`
-   In Supervisor Agent List Widget, We are showing User Name apart from Agent Name, Agent ID and Station
-   Interaction Indicator Widget, added active interaction indicator for email interactions
-   Agent Skill List Widget bot conference was not working after filter enhancements issue fixed `🛠`
-   Auto work code added by TMAC server based on intent was throwing error when removed from UI issue fixed `🛠`
-   Made changes in Supervisor Skill Dashboard to show only the skills where at least 1 agent is staffed
-   Workbench panel searched data will not be cleared when navigated to other tab and will retain the current state
-   Improvements in reminder UI (Calendar view)
-   Added new custom mat icons for attachment types for email channel
-   Home Page - Interaction Details Widget pagination issue fixed `🛠`
-   Chat Control Widget was having an issue with images in bot history fixed `🛠`
-   Minor improvements in Email Workbench advance search UI
-   Reloading from AD main page was not routing back to login page issue fixed `🛠`
-   Chat Workbench: queue polling will be triggered only when chat workbench view is active
-   Email Workbench: added polling for draft emails
-   Email Workbench: when scrolling, the entire email preview with headers and body gets scrolled issue fixed `🛠`
-   Email Workbench: queued emails counts were not showing issue fixed `🛠`
-   Email Workbench: when preview email scrolled horizontally, background colour of the email is white for the content out of the original frame issue fixed `🛠`
-   Email Workbench: advanced search fields were "readonly" issue fixed `🛠`
-   Email Workbench: from date was spelled wrong in advanced search issue fixed `🛠`
-   Email Workbench: when an email is selected to preview, selected email in the list was not highlighted issue fixed `🛠`
-   Email Workbench: forward emails, to recipient field has json content issue fixed `🛠`
-   Email Workbench: draft folder emails were not showing up issue fixed `🛠`
-   Email Workbench: emails of different email accounts were not displayed in folders issue fixed `🛠`
-   Email Workbench: in advanced search user had to type all the mailboxes manually (mailboxes are now dropdown selectable) issue fixed `🛠`
-   Email Workbench: when emails are sorted duplicate emails were shown issue fixed `🛠`
-   Email Workbench: transferred email was still present in the Queue folder issue fixed `🛠`
-   Email Workbench: bulk controls were not aligned properly issue fixed `🛠`
-   Email Workbench: now polls emails from the currently selected email category
-   Email Workbench: polling enable/disable support for email workbench email list
-   Email Workbench: cc list was missing from email preview issue fixed `🛠`
-   Email Workbench: sent email preview had "To" and "From" interchanged issue fixed `🛠`
-   Email Workbench: mailbox nodes show total emails under them instead of skills
-   Email Workbench: priority was show "NA" in email preview issue fixed `🛠`
-   Email Workbench: emails pulled from sent items were fetching from inbox queue issue fixed `🛠`
-   Email Workbench: email grouping was failing for sent items issue fixed `🛠`
-   Email Workbench: mailboxes folder now shows number of emails instead of skills under it
-   Email Interaction all attachments with similar names were removed even when one of them was removed issue fixed `🛠`
-   While forwarding an email "Please add recipient" message was shown even when the recipient was added issue fixed `🛠`
-   Email Interaction when saved as draft workbench draft tab was showing the original incoming email issue fixed `🛠`
-   Email Interaction when attachments are previewed it was showing "404" error issue fixed `🛠`
-   Email Interaction while on reply mode if another email tab was selected and comeback, the reply view was gone and only the preview mode was visible issue fixed `🛠`
-   Customer sent email with hyperlink was received without hyperlink issue fixed `🛠`
-   Email interactions tabs were not clearly visible issue fixed `🛠`
-   Email reject was not working for checker issue fixed `🛠`
-   Emails which are transferred to skill when routed to agent was not showing controls issue fixed `🛠`
-   Email and voice interaction comments when previewed invalid date was shown issue fixed `🛠`
-   Email sent to customer was missing attachments when attachments are added issue fixed `🛠`
-   When closing an email 'Close' button was disabled even after cancelling issue fixed `🛠`
-   Email template panel class had space in it causing material-dialog errors issue fixed `🛠`
-   Email Interaction was showing save interaction button twice issue fixed `🛠`
-   Email Interaction SaveAsDraft button was prompting confirmation for closing email issue fixed `🛠`
-   Email Interaction for sent items was wrong issue fixed `🛠`
-   Email Interaction body was caching even when tab switched issue fixed `🛠`
-   Email Interaction cached body was not removing once email list refreshed issue fixed `🛠`
-   Email Interaction template was not attaching to email body while replying issue fixed `🛠`
-   Email Interaction when replaying to an email, a separator (horizontal line) is added to separate previous mail from current email
-   Email Controls Widget buttons were not visible in smaller media issue fixed `🛠`
-   No dropdown was shown when reject reasons were unavailable in email interaction issue fixed `🛠`
-   Form template was not editable while replying to an email issue fixed `🛠`
-   AOT widgets can now host TemplateRefs
-   Added login form validations
-   Login page, Password field is updated with Agent Password Field and Station Password Field `config` ([see more](#changed-property-passwordenabled-boolean-to-password-object))
-   Login page, made changes to take username from query param (existing) but auto login can be disabled by setting 'al=0 or al=false' in query param
-   Login page, feature to disable lanId (config changed) ([see more](#changed-property-laniddisabled-to-disablelanid))
-   Interaction Details Widget, Added tooltip for channel and subchannel
-   Chat Control Widget, added new feature to disable reply box for agent `config` ([see more](#chat-controls-widget-data-config-changes))
-   Post Message to AD will handle 'closetab', 'closeinteraction', 'emitevent' functions ([see more](https://git.tetherfi.com:1443/releasenotes/agent-desktop#to-send-post-message-to-ad))
-   Generic Control Widget, added feature to toggle between multiple generic interactions
-   Audio/Video Control Widget, added feature to support 'one-way video' option from agent's feature list
-   On close of every interaction, all opened AOT related to that interaction will be closed
-   Create Interaction Widget, added feature to check agent feature list and enable/disable channels (config changed) ([see more](#changed-property-laniddisabled-to-disablelanid))
-   While logging out agent the query parameter preservation removed (Issue observed when username is provided in queryparam which was relogin the agent when landed on login page) issue fixed `🛠`
-   Made changed where all the Generic Interaction of type which includes 'tcm' (case insensitive) will invoke OnDacNotificationEvent
-   Now for a Generic Interaction of type 'TCMVoiceWQ' will only pop to dial the customer
-   Navbar Widget, added scroll to bottom list to keep the top list static
-   Fixed some issue related to reply on chat feature `🛠`
-   Hold button in Audio/Video Control Widget will be shown based on config
-   Agent feature enablement from OCM agent feature for chat interaction added ([see more](#added-agent-features-support-to-enabledisable-chat-features))
-   Supervisor Widget: supervisor was able to logout a user who is on call status issue fixed `🛠`
-   Updated collector.js library to version 1.1.2
-   For face auth login the video will be paused during authentication process
-   Agent Skill List Widget 'undefined' displayed Instead of agent name in the error message while transferring/conferencing to the agent on invalid aux status issue fixed `🛠`
-   AHT Tc Widget, AHT value displayed is incorrect for agent dashboard issue fixed `🛠`
-   Agent features updated from OCM will be updated in AD in realtime
-   Generic Control Widget, added new option to disable close button `config` ([see more](#generic-controls-widget-data-config-changes))
-   Added new Campaign Contact Widget `beta`
-   Other minor changes in UI
-   TMAC SDK: changed screenshare signalling messages, as per call sdk
-   TMAC SDK: added feature to upgrade from one-way video to two-way video
-   TMAC SDK: added device check feature to change the audio/video device in realtime
-   TMAC SDK: AgentForcedLogoffEvent event will be sent when agent get 'not logged in' status from server

## Application Configuration Changes

The application configuration (developement.json/login.json/default.json) has some changes in json structure and also, we have added few more configs for different functionalities.

### `Login` section changes

#### Changed property `PasswordEnabled` boolean to `Password` object

> **NOTE**: Backward compatibility has added for old `PasswordEnabled` key which will enable both Agent and Station password field. Also, if the station password is disabled agent password will be used for both LDAP and CTI (based on TMAC Server 's `Cti_AgentLoginPassword` config). **TMAC Server changes needed** for this feature to work.

```
"Login": {
        ...
        "Password": {
            "Agent": false, // agent password for LDAP
            "Station": false // station password for CTI login
        }
        ...
    }
}
```

#### Changed property `LanIdDisabled` to `DisableLanId`

To disable LAN ID field during login this config is used.

```
"Login": {
        ...
        "DisableLanId": false,
    }
}
```

### `Main` section changes

#### Create Interaction Widget `Data` config changes

Existing `Channel` key is an array of object which accept multiple channels. The sample channel config looks like below:

```
{
    "Name": "Send SMS",
    "Enabled": true, // This config is changed from 'Enable' to 'Enabled'
    ...
}
```

Please make sure to change for all channels present currently.

##### Added new `email` type to support email compose

Please add this to the list to enable compose email button.

```
{
    "Name": "Send Email",
    "Enabled": true,
    "EnableState": "",
    "Type": "email",
    "SubType": "email",
    "Icon": "email",
    "Data": {}
}
```

##### Added `Agent Features` support to enable/disable channel

We have added agent feature check to enable/disable `Create Interaction Widget` channels. By default, AD will take the config to show in create interaction channel's dropdown list. Then AD will look in **Agent Features** to disable the channel which is disabled in OCM for the current user. Currently follow are the features AD will look which can be configured in OCM.

-   IsFaxOutEnabled (Currently not supported)
-   IsSMSOutEnabled
-   IsWhatsAppOutEnabled
-   IsEmailOutEnabled

These features can be added in OCM Agent Setting page for any user to enable/disable channel in `Create Interaction Widget`. Also, we support realtime change of agent features if OCM is configured to inform TMAC on agent settings change.

#### Chat Controls Widget `Data` config changes

#### Removed unused configs `ImmediateCallbackAllowed` and `ScheduledCallbackAllowed`

```
{
    ...
    "ImmediateCallbackAllowed": false, // depricated
    "ScheduledCallbackAllowed": false // depricated
    ...
}
```

#### Added new config `ReplyAllowed`

Added new config `ReplyAllowed` to enable/disable reply box for the AD user. If this config is set to false AD will not allow the user to type any message to the customer basically the reply box will not be available.

```
{
    ...
    "ReplyAllowed": true
}
```

> **NOTE**: If this config is not added by default the value is true which means that reply box will be allowed.

##### Added `Agent Features` support to enable/disable chat features

We have added agent features check to enable/disable chat features. By default, AD will take the config to allow the user to use the feature. When the widget is mounted AD will look in **Agent Features** to disable the feature which is disabled in OCM for the current user. Currently following are the features AD will look which can be configured in OCM.

| Feature                  | Config                    | Default |
| ------------------------ | ------------------------- | ------- |
| IsAudioEscalateEnabled   | AudioEscalateAllowed      | FALSE   |
| IsVideoEscalateEnabled   | VideoEscalateAllowed      | FALSE   |
| IsChatSignatureEnabled   | SignatureAllowed          | FALSE   |
| IsChatWhiteboardEnabled  | Whiteboard.Allowed        | FALSE   |
| IsChatAttachmentsEnabled | AttachmentAllowed         | FALSE   |
| IsChatEmojiEnabled       | EmojiAllowed              | FALSE   |
| IsReplyOnChatEnabled     | ReplyOnChatAllowed        | FALSE   |
| IsChatConferenceEnabled  | Conference.Allowed        | FALSE   |
| IsChatTransferEnabled    | Transfer.Allowed          | FALSE   |
| IsChatTemplateEnabled    | ChatTemplate.Allowed      | FALSE   |
| IsChatReplyEnabled       | ReplyAllowed              | TRUE    |
| IsChatCommentEnabled     | InteractionCommentAllowed | FALSE   |
| IsChatHoldEnabled        | HoldInteractionAllowed    | FALSE   |
| IsVideoSnapshotEnabled   | Snapshot.Allowed          | FALSE   |
| IsChatVoiceNoteEnabled   | VoiceNoteAllowed          | FALSE   |
| IsChatScreenshareEnabled | ScreenShareAllowed        | FALSE   |

#### Generic Controls Widget `Data` config changes

Added new config `CloseInteractionAllowed` to enable/disable close button on Generic Interaction

```
{
    "CloseInteractionAllowed": true
}
```

> **NOTE**: If this config is not added by default the value is true which means that close button will be allowed.

#### Workbech Panel Widget `Data` config updates

Added new config `SearchPollingInterval` under Email channel to poll email on an interval when the page is active. If this config is not added or the value is '0' then the polling will be disabled.

```
{
    "Channels": [
        {
            "Type": "Email",
            "Config": {
                ...
                "SearchPollingInterval": 5000
            }
        },
        ...
    ]
}
```

### `AppConfigs` section changes

#### Removed unused configs `WindowSettings`

```
{
    ...
    "WindowSettings": { // depricated
      "SizeInPixel": false,
      "Width": 40,
      "Height": 100
    }
    ...
}
```

## [5.0.4.30](https://git.tetherfi.com:1443/releasenotes/agent-desktop/blob/master/5.0.4.30.md)

## Changelog

### Features

-   Ability to validate WebRTC connection using TestRTC added for AV interactions.
    > The TestRTC Widget allows the validate the webRTC connectivity between Agent Desktop
    > and TURN Server/Media Proxy
-   Ability to send action to remote UI for WebRTC test added for AV interactions
    > The TestRTC Widget can send a message to VIVR UI for user to check the WebRTC connection status
-   AV auto start feature (using chatmode) added
    > Agent Desktop auto starts aduio or video call if the chatmode of a TextChat Interaction is set.
-   Added new config/button to auto accept the screenshare request from CallSDK
    > With a config 'AskForScreenshareAllowed' in 'tw-chat-controls', now AD can allow user to share screen without
    > agent's consent.
-   Added new Docker Content Widget where multiple custom/in-build widgets can be displayed
    > A Docket Content Widget 'twc-docker', allows the AD to create a collection of widgets as a single screen.
    > Any type of widget can be placed inside a docker screen.
-   For chat interactions, inline text template feature added
    > When agent start typing a message, AD starts giving suggestions to agent based on Chat templates
    > created in OCM.
-   For chat Interactions, sending typing event for other party implemented
-   Conversation api integration added `beta`
    > The conversation api is used for showing a history of a conversation between two parties.
    > Agent Desktop integrated to conversation api to show all the past chat interactions for a customer.
-   Workbench feature for chat added `beta`
    > The chat workbench features shows all chat items added into workQueue. The agent has the ability
    > to pull an item from the workbench.
-   Ability to auto login the user and change status based on query parameters
    > Agent desktop accepts a username and an agent state (available, acw). Based on the received username,
    > AD login is automated, and after the login agent state change to the state given in query string.
-   Ability to replace the config value (particularly IP address) with domain name. Keyword `${domainName}` can be added instead of IP for any link configurations in Agent Desktop widget json files.
    > When `${domainName}` is used in a config url, it uses the FQDN part from the web browser url.
-   For chat Interactions, ability to reply to a particular chat feature added `beta`
    > During a chat interaction, now the agent can 'reply to' a selected message in the conversation
-   Added flat theme option in theme selector
    > Agent is given the option to enable 'flat theme mode'. When enabled, the whole AD screen will change its
    > rounded corner widgets to square corner widgets and gives a flat appearance.
-   Added web fonts selection in theme selector. Arial, Muli, Montserrat and Source Sans Pro
    > Now the agent can change the font of Agent Desktop as per their preferences.
-   Ability to navigate to instant message chat panel on click of message alert
    > When another agent sends and IM to agent, a notification is displayed. Now the agent can click on the
    > notification to navigate to IM panel and see the other user's record.
-   Ability to navigate to hold interactions on click of hold timer alert
    > When a 'hold alert' is displayed, agent can click on that alert box to navigate the correct interaction tab
-   Added dialpad for voice interaction
    > A dialpad is added for voice interaction allowing agents to send DTMF tones during a call.
    > The dialpad works with webphone and with Avaya hard phones
-   Added Available Device Media Devices Widget (tw-available-media-device) to check the media device availability (mic, camera, speaker) `beta`
-   Added Calendar Widget (tw-calendar) to view/add/update reminders and tasks
    > This new Calendar Widget is a replacement widget for old Reminder Widget. All the reminders will be
    > displayed in a calendar view with new widget.
-   Added feature to send broadcast to the team from Supervisor Widget
-   Added AV feature to agent chat (instant messaging) `beta`
    > During an IM session between two agent, now they can start an audio or video call (peer-to-peer)
-   For chat interaction whiteboard and signature action feature added `beta`
-   Added desktop alerts for interactions
    > When using Chrome for Agent Desktop, now the AD shows Chrome desktop alerts for interaction creations and updates.
-   Added IVR transfer options for voice interaction
-   Added auto refresh config for Custom Widget
    > AD can open an external URL inside a Custom Widget. Some of these URLs might require auto refresh in intervals.
    > Now the AD Custom Widget can set auto refresh intervals in JSON config.
-   Added manual refresh action in widget config (Actions)
    > For Custom Widget loading external urls, a refresh button can be enabled using JSON config which
    > allows the agent to manually refresh the widget content.
-   Added 2 widget config properties (Hidden, AutoOpen)
    > A widget can be set to 'Hidden' mode. When hidden, the widget UI is loaded (and all scripts are executed), but
    > it will not be visible to agent. A hidden widget can be used for executing some JavaScript for an integration purpose.
    > An 'AutoOpen' feature allows the widget to automatically open without agent having to click a button to open it.
-   Added new Hidden Widget feature to perform action in background for entire agent session or for any particular interaction
-   Added hold/unhold button for chat interaction
    > In previous releases, the chat hold was automatic based on tab switch during multi chats. With latest version, a hold
    > button is provided for the agent hold/unhold a chat manually.
-   Added TCIS Integration Widget
    > TCIS (TMAC Client Integration Service) is used for integrating Agent Desktop UI with think client applications. The TCIS Integration Widget enabled the AD to integrate with TCIS for think client application integrations
-   Added Generic Interaction Widgets (Generic Controls and Generic Panel)
    > Now the AD supports generic interaction tabs. If TMAC server assigns a generic interaction to an agent,
    > AD can now show the interaction tab.
-   Added User Location Widget
    > To show user location provided in chat user conencted event
-   Added support to send TMAC Events on post message request 'GetTMACEvents'

### Enchancement / Fixes

-   Updated Angular version to 11.1.1
-   Added feature to redirect to login page on AgentForcedLogoffEvent/TmacServerConnectionAborted events
-   After a failed transfer attempt for a AV chat, AV start failing issue fixed `fix`
-   Fixed the issue of AV UI not showing on page reload `fix`
-   Fixed the issue of AV UI closing when screenshare initiated and canceled `fix`
-   Chat window: On entering the emoji in the chat, it appends at the end of the text. Unable to add it in between of any of the text message issue fixed `fix`
-   Email checker reject feature enhanced with checker comments and reject reason selected from a list.
-   Customer Journey Widget made scrollable on restore view so more can be seen by scrolling
-   Email interaction UX enhancements done to make email interaction UI better
-   Fixed the issue for AV interactions where muting video was muting audio during a video call `fix`
-   Error display message added for AV screenshare canceled status
-   Content widgets size issue fixed [UI] `fix`
-   When maximized the video call tab, the video call tab buttons are hidden issue fixed `fix`
-   Once conference gets connected, the first agent's conference dialog does not close issue fixed `fix`
-   Email compose: Made changes to keep the HTML toolbar always visible in draft mode
-   Email controls "To" field error display issue fixed `fix`
-   Email workbench clearing of opened email preview on tab switch implemented
-   Application version can be seen on hover of 'Agent Desktop' word in login page
-   Added config for hiding the interaction comment feature for all interactions `config`
-   Tailwind theming added for all colored themes
-   Login page illustration changed to more attractive illustration
-   Direction of interaction (IN/OUT) is added in Interaction Details Widget for a better understanding
-   Changed Pending Callback Widget TCM Proxy url config to TCMProxyUrl `config`
-   Changed Register Callback Widget TCM Proxy url config to TCMProxyUrl `config`
-   Voice control UI changes for button placement and size
-   A feature added to allow keeping the static/anchor widget container empty so that dynamic widget container can occupy the whole space of the content screen.
-   Agent Assist, Custom Widget, Custom Content Widget will take common string literals to assign dynamic values to variables
-   Main Urls are moved from Main.Content to Main.Url in json `config`
-   Custom Widget will support JsonParse for Customer Data for a text chat interaction
-   Feature added to support placing static/anchor widgets into dynamic widget area as well. If there is a need for the user to place static interaction widgets in dynamic area, then this feature can be used.
-   For Agent Skill List Widget, enabled showing the columns based on config for agent/skill (make call/transfer/conference) list table
-   For Agent Skill List Widget, made changes to display name for selected agent/skill instead of the number
-   For Agent Skill List Widget, added display filter based on operating hours for skill list table
-   For Agent Skill List Widget, added a team filter for agent list table based on a config
-   For Supervisor Widget, added agent hierarchy filter for the agent list
-   Interaction history Widget search feature improved
-   For email interaction, emails which are transferred to an agent were not able to see the action buttons to close the email - issue fixed `fix`
-   Implemented team filter for instant messaging (IM) agent list
-   Instant messaging agent list for supervisor will show both monitoring agent and IM list agents
-   Aht-Tc (AHT, Transfer, Conference counts) Widget Data config changed (Source changed to Type: 'chart' | 'grid' and added Role: 'agent' | 'supervisor') `config`
-   Pie Chat Widget Data config changed (ChartType: 'pie' (default) | 'doughnut', Role: 'agent' | 'supervisor') `config`
-   Pie Chat Widget Data config 'Source' values changed (Source: 'auxstatus' | 'ciq' | 'intentlist' | 'totalinteractions' | 'activechannels') `config`
-   Wallboard Widget Data config changed (Source changed to Role: 'agent' | 'supervisor') `config`
-   Work Codes Widget Data config changed (Source changed to Role: 'interaction' | 'supervisor') `config`
-   Added duration in Home and Supervisor Widget config for initial data duration `config`
-   Application Router navigate to keep queryParamsHandling
-   Login page loading will be success only after getting TMAC Server version from TMAC server via SDK proxy
-   Added new no-data illustration created to show in a widget with no data to bind
-   Register Callback Widget will register for TMAC events only for the event names mentioned in DataMap ValueSource in config
-   Customer Details Widget will register for TMAC events only for the event names mentioned in DataMap ValueSource
