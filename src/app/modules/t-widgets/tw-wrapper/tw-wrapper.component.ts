import { Component, Input, OnDestroy, OnInit, ViewEncapsulation, EventEmitter, Output } from '@angular/core';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfigService } from '@fuse/services/config.service';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'tw-wrapper',
    templateUrl: './tw-wrapper.component.html',
    styleUrls: ['./tw-wrapper.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class TwWrapperComponent implements OnInit, OnDestroy {
    @Input() data: any;

    @Output() minimizeEvent = new EventEmitter();
    @Output() floatEvent = new EventEmitter();
    @Output() collapseEvent = new EventEmitter();

    fuseConfig: any;
    minimized = false;
    floating = false;
    collapsed = false;

    // Private
    _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     * @param {FuseConfigService} _fuseConfigService
     */
    constructor(private _fuseConfigService: FuseConfigService) {
        this._unsubscribeAll = new Subject();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    ngOnInit(): void {
        // Subscribe to the config changes
        this._fuseConfigService.config.pipe(takeUntil(this._unsubscribeAll)).subscribe((fuseConfig: any) => {
            this.fuseConfig = fuseConfig;
        });
    }

    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    minimize(): void {
        console.log('Minimisen');
        this.minimizeEvent.emit(this.minimized);
    }

    float(): void {
        this.floating = !this.floating;
        if (!this.floating) {
            // remove translate3d
        }
        this.floatEvent.emit(this.floating);
    }

    collapse(): void {
        this.collapsed = !this.collapsed;
        this.collapseEvent.emit(this.collapsed);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------
}
