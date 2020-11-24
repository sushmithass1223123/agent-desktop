import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Shared wrapper component
 */
@Component({
    selector: 'shared-wrapper',
    templateUrl: './shared-wrapper.component.html',
    styleUrls: ['./shared-wrapper.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class SharedWrapperComponent implements OnInit, OnDestroy {
    /**
     * Widget icon
     */
    @Input() icon: string;
    /**
     * Widget title
     */
    @Input() title: string;
    /**
     * Widget title
     */
    @Input() loading: boolean;
    /**
     * Close button ref
     */
    @ViewChild('closeBtn')
    private _closeBtn: MatButton;
    /**
     *  To store the fuse config for theme
     */
    fuseConfig: FuseConfig;
    /**
     * To unsubscribe from subscription subject
     */
    unsubscribeAll = new Subject();

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

    /**
     * To close the dialog
     */
    close(): void {
        this._closeBtn._elementRef.nativeElement.click();
    }
}
