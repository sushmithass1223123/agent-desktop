import { Component, ElementRef, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { IWidget } from 'app/interfaces';
import { ContentPageService } from 'app/services/content-page.service';

/**
 * Workbench content component
 */
@Component({
    selector: 'twc-workbench',
    templateUrl: './twc-workbench.component.html',
    styleUrls: ['./twc-workbench.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcWorkbenchComponent extends TWContentWrapper implements OnInit, OnDestroy {
    /**
     * Holds all the data related to this widget from the config
     */
    @Input() data: IWidget;
    /**
     * To hold static widgets
     */
    staticWidgets = [];
    /**
     * To hold dynamic widgets
     */
    dynamicWidgets = [];
    /**
     * To hold AOT widgets
     */
    aotWidgets = [];
    /**
     * Loaded flag
     */
    loaded: boolean;

    /**
     * Constructor
     * 
     * @param {ElementRef} hostElement
     * @param {contentPageService} ContentPageService
     */
    constructor(
        hostElement: ElementRef,
        contentPageService: ContentPageService) {
        super(hostElement, contentPageService);
    }

    /**
     * OnInit
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // get the home content widgets
        const homeWidgets = this.data.Data.Widgets || [];

        this.staticWidgets = homeWidgets.Static || [];
        this.dynamicWidgets = homeWidgets.Dynamic || [];
        this.aotWidgets = homeWidgets.AOT || [];
    }
    /**
     * OnDestroy
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    /**
     * On page active callback
     */
    onActive = () => {
        this.loaded = true;
    }

    /**
     * On page inactive callback
     */
    onInactive = () => {
        if (this.loaded && this.pageActive) {
            this.loaded = false;
        }
    }
}
