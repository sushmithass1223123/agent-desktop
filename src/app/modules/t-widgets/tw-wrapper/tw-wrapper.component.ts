import { Component, EventEmitter, HostBinding, HostListener, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { AppUiService } from '@services/app-ui.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { TMACEventService } from '@services/tmac-event.service';
import { CallHoldEvent, CallHoldReconnectEvent } from '@tmac/sdk';
import { IWidget } from 'app/interfaces';
import { TwWidgetModel } from 'app/models';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

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
    @Output() refreshEvent = new EventEmitter();

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
    // fuseConfig: FuseConfig;

    /**
     * Drag Position
     */
    dragPosition: any = '';

    /**
     * Host class for floating state
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
     * Resize
     */
    resize = false;

    /**
     * Host class for interaction on hold
     */
    @HostBinding('class.hold')
    /**
     * Flag to check interaction on hold
     */
    interactionHold: boolean;
    /**
     * Host class for style z-index
     */   
    @HostBinding('style.z-index') 
    
    /**
     * index to drag
     */
     zIndex: number;

    /**
     * index to drag and stay there
     */
    private static zIndexCounter = 1000; // Static counter for z-index
    /**
     * Unsubscribe all subject
     */
    _unsubscribeAll: Subject<any>;
    /**
     * Initially while dragging floated thing
     */
    isDragging = false;
    /**
     * Fuse custom config
     */
    customFuse = {
        anchor$: this._fuseFacadeService.anchorBgClasses$.pipe(filter(() => this.data?.Config?.Anchor)),
        widget$: this._fuseFacadeService.widgetBgClasses$,
        config$: this._fuseFacadeService.getConfig({ flatTheme: 'flatTheme' })
    };

    /**
     * Constructor
     */
    constructor (
        private _tmacEventService: TMACEventService,
        private _fuseFacadeService: FuseFacadeService,
        private _appUiService: AppUiService
    ) {
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
        // this._fuseConfigService.config.pipe(takeUntil(this._unsubscribeAll)).subscribe((fuseConfig: any) => {
        //     this.fuseConfig = fuseConfig;
        // });

        // check if the basic data input is provided, if not create a dummy widget data
        if (!this.data) {
            this.data = new TwWidgetModel('Widget', 'tw-widget');
        }

        // check the default view of widget
        if (this.data !== null && this.data.Config.ViewState !== 'restore') {
            this.maximized = this.data.Config.ViewState === 'maximize';
            this.collapsed = this.data.Config.ViewState === 'collapse';
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

        // register to hold/unhold event for interaction AOT widgets
        if (this.aot && this.data.InteractionDetails) {
            this._tmacEventService
                .getInteractionEvents(['CallHoldEvent', 'CallHoldReconnectEvent'], this.data.InteractionDetails.InteractionID)
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe((evts) => evts.forEach((evt) => this[evt.EventName](evt)));
        }
    }

    /**
     * OnDestroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
        // Remove interaction events from tmac events array
        if(this.aot && this.data.InteractionDetails) {
            this._tmacEventService.removeInteractionEvents(this.data.InteractionDetails.InteractionID, [
                'CallHoldEvent',
                'CallHoldReconnectEvent'
            ])
        }
    }

    /**
     * Widget refresh callback
     */
    refresh(): void {
        this.refreshEvent.emit();
    }

    /**
     * Widget maximzed callback
     */
    maximize(): void {
        this.maximized = !this.maximized;
        // check if collapsed then expand
        if (this.maximized && this.collapsed) {
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
        // if destroy method is defined
        if (typeof this.data.destroy === 'function') {
            this.data.destroy();
        }
    }

    /**
     * To handles CallHoldEvent
     * @param {CallHoldEvent} evt
     */
    CallHoldEvent(evt: CallHoldEvent) {
        this.interactionHold = true;
    }

    /**
     * To handles CallHoldReconnectEvent
     * @param {CallHoldReconnectEvent} evt
     */
    CallHoldReconnectEvent(evt: CallHoldReconnectEvent) {
        setTimeout(() => {
            if(!this._appUiService.isAvInteractionOnHold[evt.InteractionID]?.onHold) {
                this.interactionHold = false;
            }
         }, 50);
    }

    @HostListener('mousedown', ['$event'])
    onDragStart(event: MouseEvent): void {
        this.isDragging = true;
        this.bringToFront();
    }

    @HostListener('mouseup', ['$event'])
    onDragEnd(event: MouseEvent): void {
        this.isDragging = false;
    }

    private bringToFront(): void {
        this.zIndex = ++TwWrapperComponent.zIndexCounter;
    }
}
