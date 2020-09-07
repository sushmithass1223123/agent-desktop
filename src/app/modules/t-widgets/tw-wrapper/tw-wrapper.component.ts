import { Component, EventEmitter, HostBinding, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { IWidget } from 'app/interfaces';
import { TwWidgetModel } from 'app/models';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'tw-wrapper',
    templateUrl: './tw-wrapper.component.html',
    styleUrls: ['./tw-wrapper.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwWrapperComponent implements OnInit, OnDestroy {

    @Input() data: IWidget;

    @Output() maximizeEvent = new EventEmitter();
    @Output() collapseEvent = new EventEmitter();
    @Output() floatEvent = new EventEmitter();
    @Output() destroyEvent = new EventEmitter();

    fuseConfig: FuseConfig;

    dragPosition: any = '';

    @HostBinding('class.position-relative')
    floating = false;
    maximized = false;
    collapsed = false;
    hidden = false;
    aot = false;

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

        // check if the basic data input is provided, if not create a dummy widget data
        if (!this.data) {
            this.data = new TwWidgetModel('Widget', 'tw-widget');
        }

        // check the default view of widget
        if (this.data !== null && this.data.Config.ViewState !== 'restore') {
            this.maximized = this.data.Config.ViewState === 'maximize';
            this.collapsed = this.data.Config.ViewState === 'minimize';
            this.floating = this.data.Config.ViewState === 'float';
            this.hidden = this.data.Config.ViewState === 'hidden';
        }

        // assign the AOT config
        this.aot = this.data.Config.AOT;
    }

    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    maximize(): void {
        this.maximized = !this.maximized;
        // check if collapsed then expand
        if (!this.maximized && this.collapsed) {
            this.collapsed = false;
        }
        this.maximizeEvent.emit(this.maximized);
    }

    float(): void {
        this.floating = !this.floating;
        if (this.floating) {
            this.dragPosition = { x: 10, y: 10 };
        } else {
            this.dragPosition = { x: 0, y: 0 };
            // check if collapsed then expand
            if (this.collapsed) {
                this.collapsed = false;
            }
        }
        this.floatEvent.emit(this.floating);
    }

    collapse(): void {
        this.collapsed = !this.collapsed;
        this.collapseEvent.emit(this.collapsed);
    }

    destroy(): void {
        this.destroyEvent.emit();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------
}
