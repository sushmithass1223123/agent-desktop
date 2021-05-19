import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { AOTWidgetService } from '@services/aot-widget.service';
import { AppDataService } from '@services/app-data.service';
import { AppUiService } from '@services/app-ui.service';
import { IWidget } from 'app/interfaces';
import { map } from 'lodash';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Card header component
 * Contains all controls for maximise, float , collapse
 */
@Component({
    selector: 'tw-card-header',
    templateUrl: './tw-card-header.component.html',
    styleUrls: ['./tw-card-header.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwCardHeaderComponent implements OnInit, OnDestroy {
    /**
     * Data from app config
     */
    @Input() data: IWidget;
    /**
     * Header color
     */
    @Input() headerColor: string;
    /**
     * Current widget State
     */
    @Input() widgetState: Record<string, boolean>;

    /**
     * Refresh event emitter
     */
    @Output() refresh = new EventEmitter();

    /**
     * Maximise event emitter
     */
    @Output() maximize = new EventEmitter();

    /**
     * Floating event enmitter
     */
    @Output() float = new EventEmitter();

    /**
     * Collapse event emitter
     */
    @Output() collapse = new EventEmitter();

    /**
     * On destro event emitter
     */
    @Output() destroy = new EventEmitter();

    /**
     * Un subscribe all subject
     */
    private _unsubscribeAll: Subject<any>;
    /**
     * App config
     */
    private _appConfig: any;

    constructor(
        private _aotWidgetService: AOTWidgetService,
        private _appDataService: AppDataService,
        private _appUIService: AppUiService
    ) {
        this._unsubscribeAll = new Subject();
    }

    /**
     * Lifecycle hook OnInit
     */
    ngOnInit(): void {
        this._appDataService.config
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: any) => {
                this._appConfig = config;
            });
    }

    /**
     * Lifecycle hook OnDestroy
     */
    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    /**
     * Refresh method
     */
    refreshWidget(): void {
        this.refresh.emit();
    }

    /**
     * Maximize method
     */
    maximizeWidget(): void {
        this.maximize.emit();
    }

    /**
     * Float method
     */
    floatWidget(): void {
        this.float.emit();
    }

    /**
     * Collapse  method
     */
    collapseWidget(): void {
        this.collapse.emit();
    }

    /**
     * To pin a widget
     */
    pinWidget(): void {
        // add the widget to the list
        this.data.Config.Pinned = !this.data.Config.Pinned;

        // get the main AOT list
        let aots = this._appConfig.Main.AOT.Widgets || [];

        // check this widget in list
        const thisInAOT = aots.filter((widget: IWidget) => widget.Key === this.data.Key)?.[0];

        // check if pinned
        if (this.data.Config.Pinned) {
            this._appUIService.showSnackbar('Widget added to pinned list');
            // check widget in AOT list
            if (thisInAOT) {
                aots = map(aots, (widget: IWidget) => {
                    if (widget.Key === this.data.Key) {
                        widget.Config.Pinned = true;
                    }
                    return widget;
                });
            }
            else {
                aots.push(this.data);
            }
        }
        else {
            this._appUIService.showSnackbar('Widget removed from pinned list');
            // check widget in AOT list
            if (thisInAOT) {
                aots = map(aots, (widget: IWidget) => {
                    if (widget.Key === this.data.Key) {
                        widget.Config.Pinned = false;
                    }
                    return widget;
                });
            }
            else {
                aots = aots.filter((widget: IWidget) => widget.Key !== this.data.Key);
            }
        }

        // update the service data
        this._appDataService.config = {
            ...this._appConfig, ...{
                Main: {
                    AOT: {
                        Widgets: [...aots]
                    }
                }
            }
        };
    }

    /**
     * Need more description
     * Special method for AOT widget's destruction
     */
    destroyAOTWidget(): void {
        // get widget id
        const id = this.data.ID;
        // check if id is available, then call destroy
        if (id) {
            this._aotWidgetService.destroyWidget(id);
            this.destroy.emit();
        }
    }
}
