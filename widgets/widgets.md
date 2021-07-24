# Agent Desktop Widgets

##### Version: 5.0.4.30

## Table of Contents

-   [Introduction](#introduction)
-   [Widgets](#widgets)
    -   [tw-sample](#tw-sample)

## Introduction

Agent Desktop is developed based on widget configuration. Each widget is unique by its `Type` property. Following is basic structre of a widget where `Data` property will have the configuration data particular to a widget.

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
        "AOT": false, // To make widget Always On Top
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
        "ViewState": "restore", // Initial view state of a widget ('restore' | 'maximize' | 'collapse' | 'hidden' | 'float')
        "Header": true, // To show/hide header for the widget
        "Pinned": false // To mark widget as pinned (not supported now)
    },
    "Data": { } // Extra configuration particular to a widget
}
```

## Widgets

#### tw-sample

This is a sample widget

```
{
    ...
    "Data": {

    }
}
```
