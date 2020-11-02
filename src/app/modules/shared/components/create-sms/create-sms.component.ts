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
export class CreateSMSComponent implements OnInit, OnDestroy {
    /**
     *  To store the fuse config for theme
     */
    fuseConfig: FuseConfig;
    /**
     * To unsubscribe from subscription subject
     */
    unsubscribeAll = new Subject();
    /**
     * Contact list
     */
    contacts = [];

    constructor(
        private _fuseConfigService: FuseConfigService
    ) { }

    /**
     * OnInit
     */
    ngOnInit(): void {
        this._fuseConfigService.config
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((config: any) => {
                this.fuseConfig = config;
            });
    }

    /**
     * OnDestroy
     */
    ngOnDestroy(): void {
        this.unsubscribeAll.next();
        this.unsubscribeAll.complete();
    }
}
