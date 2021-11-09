import { Widget } from '..';
import { Component, Input, OnDestroy, OnInit, TemplateRef, Type, ViewChild, ViewContainerRef, ViewEncapsulation } from '@angular/core';

export type TwPanel = Widget<TwPanelData>;

export interface TwPanelData {
    templateRef: TemplateRef<any>;
}
