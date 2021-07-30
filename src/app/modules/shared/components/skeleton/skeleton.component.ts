import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'skeleton',
    templateUrl: './skeleton.component.html',
    styleUrls: ['./skeleton.component.scss']
})
export class SkeletonComponent implements OnInit {
    @Input('rows') rows = 1;
    @Input('colored') colored = false;
    
    rowArray = [];

    constructor() {}

    ngOnInit(): void {
        this.rowArray = new Array(this.rows);
    }
}
