import { Component, OnInit, Input, OnDestroy, ViewEncapsulation, AfterViewInit, AfterContentInit } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { DomSanitizer } from '@angular/platform-browser';
import { IAgentData, SDKClient } from 'tmac-sdk';
import { AGENT_DATA_MAP } from 'app/constants';
import { IWidget } from 'app/interfaces';
import { AOTWidgetService } from '@services/aot-widget.service';

@Component({
    selector: 'tw-custom',
    templateUrl: './tw-custom.component.html',
    styleUrls: ['./tw-custom.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwCustomComponent extends TWidgetWrapper implements OnInit, AfterContentInit, OnDestroy {
    @Input() data: IWidget;

    loaded = false;
    url: any;
    agentData: IAgentData;
    queryParamMap: any[];
    show: boolean;

    constructor(
        private sanitizer: DomSanitizer,
        private _aotWidgetService: AOTWidgetService
    ) {
        super();
    }

    // tslint:disable-next-line: completed-docs
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // check if the url is provided
        if (this.data.Data.Url) {
            // get the url
            let url = this.data.Data.Url;

            // get the agent data map
            const mapObj = AGENT_DATA_MAP();

            // add the query param
            const reg = new RegExp(Object.keys(mapObj).join('|'), 'gi');
            url = url.replace(reg, (matched: any) => {
                return mapObj[matched];
            });

            // check 'Open In New' widget
            if (this.data.Data.OpenInNew) {
                const widget = window.open(
                    url,
                    this.data.Name,
                    `menubar=no,resizable=yes,location=no,scrollbars=no,
                    width=${this.data.Config.Position.W || screen.width},
                    height=${this.data.Config.Position.H || screen.height}`
                );

                // listen to widget close event
                widget.onunload = () => {
                    // destroy the widget
                    this._aotWidgetService.destroyWidget(this.data.ID);
                };

                return;
            }

            // load the iframe URL
            this.url = this.transform(url);

            // set show to true
            this.show = true;
        }

        setTimeout(() => {
            this.loaded = true;
        }, 3000);
    }

    ngAfterContentInit(): void {
        // check if the widget is 
    }

    // tslint:disable-next-line: completed-docs
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    transform(url: string): any {
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
}
