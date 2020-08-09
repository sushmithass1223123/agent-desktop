import { Component, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { TWLibrary } from '@twidgets/utils/widget-library/tw-library';
import { IWidget } from 'app/interfaces';
import { ContentPageService } from 'app/services/content-page.service';

@Component({
    selector: 'twc-supervisor',
    templateUrl: './twc-supervisor.component.html',
    styleUrls: ['./twc-supervisor.component.scss']
})
export class TwcSupervisorComponent extends TWContentWrapper implements OnInit, OnDestroy {

    @Input() data: any;

    supervisorWidgets = [];

    constructor(
        public hostElement: ElementRef,
        public contentPageService: ContentPageService
    ) {
        super(hostElement, contentPageService);
    }

    ngOnInit(): void {
        this.initWrapper(this.data);

        // get the content widgets
        const widgets = this.data.Data.Widgets || [];
        // loop and get the widgets
        widgets.forEach((widget: IWidget) => {
            // get the widget component by type
            const component = TWLibrary.getWidget(widget.Type, widget);
            // check if the component is proper
            if (component) {
                // append the widget component to the list
                this.supervisorWidgets.push(component);
            }
        });
    }


    ngOnDestroy(): void {
        this.destroyWrapper();
    }

}
