import { Component, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'tw-preview',
    templateUrl: './tw-preview.component.html',
    styleUrls: ['./tw-preview.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwPreviewComponent implements OnInit {

    previewWidgets = [];

    constructor() { }

    ngOnInit(): void {
        // api call to IW to get get preview json based on template name in the query param
        
    }

}
