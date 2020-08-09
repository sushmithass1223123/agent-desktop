import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { TWContentLibrary } from '@modules/t-widgets/utils';
import { IWidget } from 'app/interfaces';
import { AppDataService } from 'app/services/app-data.service';
import { ContentPageService } from 'app/services/content-page.service';

@Component({
    selector: 'content',
    templateUrl: './content.component.html',
    styleUrls: ['./content.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ContentComponent implements OnInit {

    viewMode = '';
    contentWidgets = [];

    /**
     * Constructor
     */
    constructor(
        private appDataService: AppDataService,
        private contentPageService: ContentPageService
    ) {
    }

    ngOnInit(): void {
        // get the config
        const config = this.appDataService.getConfig();
        // check if the config is not null
        if (config !== null) {
            // get the content widgets
            const widgets = config.Main.Content.Widgets || [];
            // loop and get the widgets
            widgets.forEach((widget: IWidget) => {
                // get the widget component by type 
                const component = TWContentLibrary.getWidget(widget.Type, widget);
                // check if the component is proper
                if (component) {
                    // append the widget component to the list
                    this.contentWidgets.push(component);
                }
            });
        }
    }

    updateViewMode(mode: string): void {
        this.contentPageService.updateViewMode(mode);
    }
}
