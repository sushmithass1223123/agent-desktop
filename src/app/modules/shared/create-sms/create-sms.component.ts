import { Component, OnDestroy, OnInit } from '@angular/core';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/internal/operators/takeUntil';

/**
 *  Create  SMS Component
 */
@Component({
    selector: 'app-create-sms',
    templateUrl: './create-sms.component.html',
    styleUrls: ['./create-sms.component.scss']
})
export class CreateSmsComponent implements OnInit, OnDestroy {
    /**
     * --------------------------------------------------
     *  @ [OPTIONAL] to store the fuse config for theme
     * --------------------------------------------------
     */
    fuseConfig: FuseConfig;

    unsubscribeAll = new Subject();

    contacts = [];

    constructor(private _fuseConfigService: FuseConfigService) {}

    ngOnInit(): void {
        this._fuseConfigService.config.pipe(takeUntil(this.unsubscribeAll)).subscribe((config: any) => {
            this.fuseConfig = config;
        });
    }

    ngOnDestroy(): void {
        this.unsubscribeAll.complete();
    }
}
