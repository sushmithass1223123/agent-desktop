import { Component, EventEmitter, HostBinding, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { IWidget } from 'app/interfaces';
import { TwWidgetModel } from 'app/models';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs/operators';

/**
 * TW Wrapper component
 * All widgets rendered inside this
 */
@Component({
    selector: 'tw-wrapper',
    templateUrl: './tw-wrapper.component.html',
    styleUrls: ['./tw-wrapper.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwWrapperComponent implements OnInit, OnDestroy {

    /**
     * Data form app config
     */
    @Input() data: IWidget;

    /**
     * Maximise event emitter
     */
    @Output() maximizeEvent = new EventEmitter();

    /**
     * Collapse event emitter
     */
    @Output() collapseEvent = new EventEmitter();

    /**
     * Float event emitter
     */
    @Output() floatEvent = new EventEmitter();

    /**
     * Destroy event emitter
     */
    @Output() destroyEvent = new EventEmitter();

    /**
     * Fuse Config
     */
    fuseConfig: FuseConfig;

    /**
     * Drag Position
     */
    dragPosition: any = '';

    /**
     * Host Class
     */
    @HostBinding('class.position-relative')

    /**
     * Floating state
     */
    floating = false;
    /**
     * Maximized state
     */
    maximized = false;
    /**
     * Collapsed state
     */
    collapsed = false;
    /**
     * Hidden
     */
    hidden = false;
    /**
     * AOT
     */
    aot = false;
    /**
     * Pinned
     */
    pinned = false;

    /**
     * Unsubscribe all subject
     */
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
    /**
     * OnInit
     */
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

        // set the drag position for AOT
        if (this.aot) {
            const x = (this.data.Config.Position.W || 10) / 2;
            this.dragPosition = { x: -x, y: -50 };
        }

        // assign the Pinned config
        this.pinned = this.data.Config.Pinned;
    }

    /**
     * OnDestroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    /**
     * Widget maximzed callback
     */
    maximize(): void {
        this.maximized = !this.maximized;
        // check if collapsed then expand
        if (!this.maximized && this.collapsed) {
            this.collapsed = false;
        }
        this.maximizeEvent.emit(this.maximized);
    }

    /**
     *  Widget float callback
     */
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

    /**
     *  Widget collapse callback
     */
    collapse(): void {
        this.collapsed = !this.collapsed;
        this.collapseEvent.emit(this.collapsed);
    }

    /**
     * Widget destroy callback
     */
    destroy(): void {
        this.destroyEvent.emit();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------
}
