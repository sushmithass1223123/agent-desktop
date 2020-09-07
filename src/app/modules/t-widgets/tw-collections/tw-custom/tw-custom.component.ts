import { Component, OnInit, Input, OnDestroy, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { DomSanitizer } from '@angular/platform-browser';
import { IAgentData, SDKClient } from 'tmac-sdk';
import { AGENT_DATA_MAP } from 'app/constants';

@Component({
    selector: 'tw-custom',
    templateUrl: './tw-custom.component.html',
    styleUrls: ['./tw-custom.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwCustomComponent extends TWidgetWrapper implements OnInit, OnDestroy {

    @Input() data: any;

    loaded = false;
    url: any;
    agentData: IAgentData;
    queryParamMap: any[];

    constructor(private sanitizer: DomSanitizer) {
        super();
    }

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

            // load the iframe URL
            this.url = this.transform(url);
        }
        
        setTimeout(() => {
            this.loaded = true;
        }, 3000);
    }

    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    transform(url: string): any {
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

}
