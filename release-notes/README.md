# Agent Desktop

## Table of Contents

-   [Additional Information](#additional-information)
-   [Release Information](#release-information)
-   [Deployment](#deployment)

## Additional Information

### AD Theming

AD provides a set of ready-to-use themes for convenience. You can apply them by changing the value of `Theme` under the `AppConfigs` section of AD config. Available themes are listed below:

-   theme-default `Default`
-   theme-default-2
-   theme-default-3
-   theme-teal-red
-   theme-cyan-orange
-   theme-default-dark
-   theme-blue-grey-dark
-   theme-pink-grey-dark

AD provides a set of ready-to-use font styles for convenience. You can apply them by changing the value of `Font` under the `AppConfigs` section of AD config. Available fonts are listed below:

-   wf-muli `Default`
-   wf-montserrat
-   wf-source-sans-pro

### AD Widget config definition

Agent Desktop is developed based on widget configuration. Each widget is unique by its `Type` property. Following is the basic structure of a widget where the `Data` property will have the configuration data particular to a widget.

```
{
    "Name": "Sample Widget", // Name of the widget
    "Description": "This is a sample widget", // Description of the widget
    "Key": "Sample", // Widget key
    "Type": "tw-sample", // Type of widget and unique for all widgets
    "Config": { // Configuration section for the widget
        "Enabled": true, // To enable or disable a widget
        "Hidden": false, // To hide a widget from view
        "Static": false, // To make the widget static
        "Anchor": false, // To make the widget an anchor widget
        "AOT": false, // To make widget (AOT) Always On Top
        "AutoOpen": false, // To auto open a AOT widget (supported only for AOT widget)
        "Icon": "widgets", // Icon for the widget
        "Class": "", // Extra class for the widget
        "Position": { // Postion of the widget
            "X": 2, // X axis span (not supported in AOT widget)
            "Y": 1, // Y axis span (not supported in AOT widget)
            "W": "300px", // Width of widget (supported and should be added only for AOT widget)
            "H": "300px" // Height of widget (supported and should be added only for AOT widget)
        },
        "Actions": [ // Action button on the widget
            "maximize", // To maximize a widget
            "float", // To float a widget (not supported in AOT widget)
            "restore", // To restore a widget when floating or maximized
            "collapse", // To collapse a widget
            "destroy", // To destroy a widget (supported only for AOT widget)
            "refresh" // To refresh a custom widget (supported only for Type 'tw-custom')
        ],
        "ViewState": "restore", // Initial view state of a widget ('restore' | 'maximize' | 'collapse' | 'float')
        "Header": true, // To show/hide header for the widget
        "Pinned": false // To mark widget as pinned (not supported yet)
    },
    "Data": { } // Extra configuration particular to a widget
}
```

### AD custom icons

AD provides set of custom icons apart from [Material Icons](https://fonts.google.com/icons?selected=Material+Icons). You can apply those icons to a widget config by changing the value of `Icon` under `Config` in a [widget configuration](#ad-widget-config-definition). Available custom icons are listed below:

-   `custom-fb` (Facebook Messenger icon)
-   `custom-file-audio` (Audio file icon)
-   `custom-file-default` (Default file icon)
-   `custom-file-excel` (Excel file icon)
-   `custom-file-image` (Image file icon)
-   `custom-file-pdf` (PDF file icon)
-   `custom-file-ppt` (PPT file icon)
-   `custom-file-text` (Text file icon)
-   `custom-file-video` (Video file icon)
-   `custom-file-word` (Word file icon)
-   `custom-file-video` (Video file icon)
-   `custom-file-zip` (Zip file icon)
-   `custom-line` (Line icon)
-   `custom-telegram` (Telegram icon)
-   `custom-twitter` (Twitter icon)
-   `custom-viber` (Viber icon)
-   `custom-we` (WeChat icon)
-   `custom-whatsapp` (WhatsApp icon)

### To send Post message to AD

Post messages can be sent to AD to handle multiple functionalities like the close tab or to emit a custom event.
Sample post message:

```
element.postMessage({
    function: 'sampleFunction', // Function name
    name: window.name, // For AD to identify the iframe by name [This is must]
    callback: null, // Any callback needed
    data: data, // Data to send of type object
    destination: "tmac", // For AD to filter incoming post messages [This is must]
    source: "campaignselector", // Any source of post message initiator
    userObject: null // Any user object
}, "*");
```

-   To close tab in AD, proivde function name as 'closetab' or 'closeinteraction'
-   To emit a custom event in AD, provide function name as **emitevent**. `data` property of **emitevent** function must have 'EventName' and 'InteractionID' (For an interaction)
    ```
    {
        EventName: 'TestEvent', // Name of the event to emit
        InteractionID: 0, // ID of interaction if interaction event
        ...
    }
    ```
-   Current apps sending post messages to emit an event on TMAC UI can still the same as AD but expected the function name should end with **event**. E.g.: 'Test**Event**'.
-   To get all the current events in AD, send a postMessage with the function name as **gettmacevents**. An example is given below:
    ```
    element.postMessage({
        function: 'gettmacevents',
        name: window.name,
        callback: null,
        data: null,
        destination: "tmac",
        source: "source-app-name",
        userObject: null
    }, "*");
    ```

> **NOTE**: All the post messages sent to AD must have **destination** as `tmac`, else AD will reject all the post messages. Even the existing post messages should also have the same change. Also, **name** as `window.name` else if the post message sent is to get some value from AD will not be received.

-   To listen to post message sent by AD, please add event listener for **message**. Following example will show how to get TMAC events:

```
window.addEventListener("message", (res) => {
    // TMAC event will be available here
    if (res?.data?.function === "onTMACEvent") {
        res.data.data.forEach((e) => {
            // 'e' will have TMAC event (e.EventName, ...)
        });
    }
});
```

### AD-TMC installer integration

TMC related files are added to support the TCM installer. Added files are:

-   tmc.config
-   tmc_production.template
-   TMC_Data.json

> **NOTE**: These files are a must to support the TMC installer, so please make sure these files are available when using the TMC installer to install AD

### AD windows authentication

AD is now compatible to support window authentication. AD root has a file named `auth.aspx` which will fetch the windows user identity name and route to the AD login page.

In order to get authentication page load AD with `https://<ip:port>/auth.aspx`. Auth page will get the user identity and route back to the AD login page.

```
const url = '/agent-desktop/'; // this should be changed based on <IIS-application-name>
const autoLogin = false;
```

The given configs can be found in auth.aspx file where URL accepts the application-name and autoLogin is used to set the flag to auto-login the user when routed to the login page.

In IIS default page should be configured as `auth.aspx` for AD application to get authentication page by default.

## Release Information

SVN URLs:

-   [Agent Desktop Version Release](svn://repo.tetherfi.com/InterLink/ProductReleases/Versions/TMAC/Agent-Desktop)
-   [Agent Desktop Latest Release](svn://repo.tetherfi.com/InterLink/ProductReleases/Latest/TMAC/Agent-Desktop)
-   [SDK Version Release](svn://repo.tetherfi.com/InterLink/ProductReleases/Versions/TMAC/SDK)
-   [SDK Latest Release](svn://repo.tetherfi.com/InterLink/ProductReleases/Latest/TMAC/SDK)
-   [SDK Lite Version Release](svn://repo.tetherfi.com/InterLink/ProductReleases/Versions/TMAC/SDKLite)
-   [SDK Lite Latest Release](svn://repo.tetherfi.com/InterLink/ProductReleases/Latest/TMAC/SDKLite)
-   [Documents](svn://repo.tetherfi.com/InterLink/ProductReleases/Docs/TMAC/Agent-Desktop)

## Deployment

The Agent Desktop production files can be hosted on any web server. The steps for each are shown in the Deployment section below.

> Every Angular build compiles to bundles of different CSS or js files, so when deploying in any instance, make sure you delete all the existing files before adding the new set of files since every bundle will be different.

### Setup required for IIS:

Agent Desktop can be deployed as a web app by adding the `Agent-Desktop` folder to the application pool.

### Steps to be followed while setting up:

Create the desired folder in any required location and place the Agent Desktop files inside it.

Add the folder as an application under Application Pool in the IIS.

> Since it is an Angular web application, there are several internal routings and to make sure it works fine after refreshes, we need to set up URL rewrite and redirection.

After adding the Agent Desktop as an application, click on it, and in the right-hand section check if you have URL Rewrite Module installed in the IIS. In case if not available, download and install it from the given link below.

> Purpose: IIS URL Rewrite 2.1 enables Web administrators to create powerful rules to implement URLs that are easier for users to remember and easier for search engines to find.

[https://www.iis.net/downloads/microsoft/url-rewrite](https://www.iis.net/downloads/microsoft/url-rewrite)`

#### web.config

> **NOTE**: The URL attribute of the action tab should contain IIS-application-name

```
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="deeplink">
                    <match url="^(.*)$" />
                    <action type="Rewrite" url="/<IIS-application-name>/" />
                    <conditions>
                        <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
                    </conditions>
                </rule>
            </rules>
        </rewrite>
        <staticContent>
            <mimeMap fileExtension=".webmanifest" mimeType="application/manifest+json" />
        </staticContent>
    </system.webServer>
</configuration>
```

#### index.html

> **NOTE**: The href attribute of the base tag should contain IIS-application-name

```
...
<base href="/<IIS-application-name>/">
....
```

#### auth.aspx

> **NOTE**: The value of URL variable should contain IIS-application-name

```
...
const url = '/<IIS-application-name>/';
....
```

##### By default, `auth.aspx` url variable, `index.html` href attribute of base tag and `web.config` url attribute of action tag of type Rewrite has value `/agent-desktop/`.
