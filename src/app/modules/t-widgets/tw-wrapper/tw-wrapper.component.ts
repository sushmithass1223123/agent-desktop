import { Component, ElementRef, EventEmitter, HostBinding, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
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

    @HostBinding('class.position-relative')
    floating = false;
    dragPosition: any = '';

    @Output() maximizeEvent = new EventEmitter();
    @Output() collapseEvent = new EventEmitter();
    @Output() floatEvent = new EventEmitter();

    fuseConfig: any;
    maximised = false;
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

    maximize(): void {
        this.maximised = !this.maximised;
        this.maximizeEvent.emit(this.maximised);
    }

    float(): void {
        this.floating = !this.floating;
        if (this.floating) {
            this.dragPosition = { x: 10, y: 10 };
        } else {
            this.dragPosition = { x: 0, y: 0 };
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
