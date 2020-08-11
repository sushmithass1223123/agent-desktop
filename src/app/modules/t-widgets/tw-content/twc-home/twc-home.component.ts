import { Component, OnInit, OnDestroy, Input, ElementRef, ViewEncapsulation } from '@angular/core';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { TWLibrary } from '@twidgets/utils/widget-library/tw-library';
import { ContentPageService } from 'app/services/content-page.service';
import { IWidget } from 'app/interfaces';

@Component({
    selector: 'twc-home',
    templateUrl: './twc-home.component.html',
    styleUrls: ['./twc-home.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcHomeComponent extends TWContentWrapper implements OnInit, OnDestroy {

    @Input() data: any;

    homeWidgets = [];

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
                this.homeWidgets.push(component);
            }
        });
    }


    ngOnDestroy(): void {
        this.destroyWrapper();
    }

}
