import { Component, ElementRef, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { IWidget } from 'app/interfaces';
import { ContentPageService } from 'app/services/content-page.service';
import { DashboardService } from '@services/dashboard.service';

@Component({
    selector: 'twc-supervisor',
    templateUrl: './twc-supervisor.component.html',
    styleUrls: ['./twc-supervisor.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcSupervisorComponent extends TWContentWrapper implements OnInit, OnDestroy {

    @Input() data: IWidget;

    staticWidgets = [];
    dynamicWidgets = [];

    constructor(
        public hostElement: ElementRef,
        public contentPageService: ContentPageService,
        private _dashboardService: DashboardService
    ) {
        super(hostElement, contentPageService);
    }

    ngOnInit(): void {
        this.initWrapper(this.data);
        // call the wrapper init method

        // get the content widgets
        const supervisorWidgets = this.data.Data.Widgets || [];

        this.staticWidgets = supervisorWidgets.Static;
        this.dynamicWidgets = supervisorWidgets.Dynamic;
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }
}
