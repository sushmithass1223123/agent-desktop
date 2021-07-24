import { Injectable } from '@angular/core';
import { SharedWrapper } from '@modules/t-widgets/utils/widget-wrapper/shared-wrapper';
import { IWidget } from 'app/interfaces';
import { TwWidgetModel } from 'app/models';
import { merge } from 'lodash';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppDataService } from './app-data.service';

/**
 * Service for AOT - Always On Top Widgets
 */
@Injectable({
    providedIn: 'root'
})
export class AOTWidgetService extends SharedWrapper {
    /**
     * Subject to unsubscribe for all subscriptions
     */
    private _unsubscribeAll: Subject<any>;
    /**
     * Widget subject to emit when AOT is added or removed
     */
    private _widgetsSubject: BehaviorSubject<IWidget[]>;

    constructor(private _appDataService: AppDataService) {
        super();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for widgets
     */
    get widgets(): any | Observable<any> {
        return this._widgetsSubject.asObservable();
    }

    /**
     * To subscribe to the service
     */
    public subscribe(): void {
        this.logger.info('subscribe', false);

        // init the subject
        this._unsubscribeAll = new Subject();
        this._widgetsSubject = new BehaviorSubject([]);

        // get the config and check for AOT widgets
        this._appDataService.config.pipe(takeUntil(this._unsubscribeAll)).subscribe((config: any) => {
            // get the AOT widgets
            const widgets = config.Main.AOT.Widgets;
            this.processAOTWidgets(widgets);
        });
    }

    /**
     * To process AOT widgets
     *
     * @param {IWidget[]} widgets
     */
    public processAOTWidgets(widgets: IWidget[]): void {
        // validate
        if (widgets && widgets.length) {
            // check if widgets are there, if so load it
            widgets.forEach((widget: IWidget) => {
                // check if auto open
                if (widget.Config.AutoOpen) {
                    setTimeout(() => {
                        this.addWidget(widget);
                        // set auto open to false so that when config is updated it wont open again
                        widget.Config.AutoOpen = false;
                    }, 3000);
                }
            });
        }
    }

    /**
     * To add a new AOT widget
     * @param widget Widget model
     */
    public addWidget(widget: IWidget): void {
        // check if the widget is null
        if (!widget || !widget.Config.Enabled) {
            return;
        }

        // prepare widget data, use TwWidgetModel to make sure that newly added config is added
        // with default value inorder to stop app from breaking
        widget = merge({}, new TwWidgetModel(widget.Name, widget.Type), widget);

        // set AOT true
        widget.Config.AOT = true;

        // get the value from the behavior subject
        const widgetList = this._widgetsSubject.getValue();

        // push the new content
        widgetList.push(widget);

        // listen to destory widget invokation
        widget.destroy = () => {
            this.destroyWidget(widget.ID, true);
        };

        // notify the observers
        this._widgetsSubject.next(widgetList);
    }

    /**
     * To destroy a AOT widget
     * @param id ID of the widget
     * @param force [OPTIONAL] To force close widget with out triggering OnDestroy
     */
    public destroyWidget(id: string, force?: boolean): void {
        // check if the id is null
        if (!id) {
            this.logger.warn('destroyWidget: widget ID is not found!', false);
            return;
        }

        // get the value from the behavior subject
        let widgetList = this._widgetsSubject.getValue();
        const currentCount = widgetList.length;

        // if there are no widgets for this id return
        if (currentCount === 0) {
            return;
        }

        // get the widget
        const widget = widgetList.filter((w) => w.ID === id)?.[0];

        // get the widget and call on destroy
        if (widget && typeof widget.OnDestroy === 'function' && !force && !widget.OnDestroy()) {
            return;
        }

        // remove the widget
        widgetList = this._widgetsSubject.getValue().filter((w) => w.ID !== id);

        // check if any item is removed
        if (widgetList.length !== currentCount) {
            // notify the observers
            this._widgetsSubject.next(widgetList);
        }
    }

    /**
     * To get the current widget list
     */
    public getWidgets(): IWidget[] {
        return { ...this._widgetsSubject.getValue() };
    }

    /**
     * To unsubscribe from the service
     */
    public unsubscribe(): void {
        this.logger.info('unsubscribe', false);

        // unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();

        this._widgetsSubject.next([]);
        this._widgetsSubject.complete();
    }
}
