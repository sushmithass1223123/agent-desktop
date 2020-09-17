import { Component, ElementRef, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { IWidget } from 'app/interfaces';
import { ContentPageService } from 'app/services/content-page.service';
import { DashboardService } from '@services/dashboard.service';

@Component({
    selector: 'twc-workbench',
    templateUrl: './twc-workbench.component.html',
    styleUrls: ['./twc-workbench.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcWorkbenchComponent extends TWContentWrapper implements OnInit, OnDestroy {
    @Input() data: IWidget;

    staticWidgets = [];
    dynamicWidgets = [];
    aotWidgets = [];

    constructor(public hostElement: ElementRef, public contentPageService: ContentPageService, private _dashboardService: DashboardService) {
        super(hostElement, contentPageService);
    }

    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // get the home content widgets
        const homeWidgets = this.data.Data.Widgets || [];

        this.staticWidgets = homeWidgets.Static || [];
        this.dynamicWidgets = homeWidgets.Dynamic || [];
        this.aotWidgets = homeWidgets.AOT || [];
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }
}
