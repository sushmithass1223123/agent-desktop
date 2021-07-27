import { Injectable } from '@angular/core';
import { SharedWrapper } from '@modules/t-widgets/utils/widget-wrapper/shared-wrapper';
import { TUtils } from '@tmac/sdk';
import { IWidget } from 'app/interfaces';
import { TwWidgetModel } from 'app/models';
import { merge } from 'lodash';
import { BehaviorSubject, concat, Observable, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { AppDataService } from './app-data.service';
import { AppUiService } from './app-ui.service';

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
    private _widgets$: BehaviorSubject<IWidget[]>;

    /**
     * New widget subject
     */
    private _newWidget$: Subject<INewAOT>;

    constructor(private _appDataService: AppDataService, private _appUiService: AppUiService) {
        super();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for widgets
     */
    get widgets(): any | Observable<any> {
        return this._widgets$.asObservable();
    }

    /**
     * Getter for new widget
     */
    newWidget(page: IWidgetPage): Observable<INewAOT> {
        const tempSub = new Subject<INewAOT>();
        setTimeout(() => {
            try {
                const get = sessionStorage.getItem('ad-temp-widget');
                const set = get ? JSON.parse(get) : [];
                set.forEach((elm: any) => {
                    tempSub.next(elm);
                });
            } catch (error) {}
            tempSub.complete();
        });
        return concat(tempSub, this._newWidget$).pipe(filter((f) => f && f.page === page));
    }

    /**
     * To subscribe to the service
     */
    public subscribe(): void {
        this.logger.info('subscribe', false);

        // init the subject
        this._unsubscribeAll = new Subject();
        this._widgets$ = new BehaviorSubject([]);
        this._newWidget$ = new Subject();

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

        // get the value from the behavior subject
        const widgetList = this._widgets$.getValue();
        const alreadyOpen = widgetList.find((w) => w.Type === widget.Type);
        if (alreadyOpen) {
            const trailMsg = alreadyOpen.Name !== widget.Name ? `by the name ${alreadyOpen.Name}` : '';
            this._appUiService.showSnackbar(`${widget.Name || 'This widget'} has already been opened ${trailMsg}`, 'failure');
            return;
        }

        // prepare widget data, use TwWidgetModel to make sure that newly added config is added
        // with default value inorder to stop app from breaking
        widget = merge({}, new TwWidgetModel(widget.Name, widget.Type), widget);

        // set AOT true
        widget.Config.AOT = true;

        // push the new content
        widgetList.push(widget);

        // listen to destory widget invokation
        widget.destroy = () => {
            this.destroyWidget(widget.ID, true);
        };

        // notify the observers
        this._widgets$.next(widgetList);
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
        let widgetList = this._widgets$.getValue();
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
        widgetList = this._widgets$.getValue().filter((w) => w.ID !== id);

        // check if any item is removed
        if (widgetList.length !== currentCount) {
            // notify the observers
            this._widgets$.next(widgetList);
        }
    }

    /**
     * TO add new AOT widget to any page
     *
     * @param {IWidgetPage} page
     * @param {String} json
     */
    public addNewWidget(page: IWidgetPage, json: string): boolean {
        try {
            const item = {
                page,
                json: JSON.parse(json)
            } as INewAOT;
            item.json.ID = TUtils.Generic.uuid();
            this._newWidget$.next(item);
            const key = 'ad-temp-widget';
            const get = sessionStorage.getItem(key);
            const set = get ? JSON.parse(get) : [];
            set.push(item);
            sessionStorage.setItem(key, JSON.stringify(set));
            return true;
        } catch (error) {}
        return false;
    }

    /**
     * To get the current widget list
     */
    public getWidgets(): IWidget[] {
        return { ...this._widgets$.getValue() };
    }

    /**
     * To unsubscribe from the service
     */
    public unsubscribe(): void {
        this.logger.info('unsubscribe', false);

        // unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();

        this._widgets$.next([]);
        this._widgets$.complete();
    }
}

export interface INewAOT {
    /**
     * Page of widget
     */
    page: IWidgetPage;
    /**
     * Widget json
     */
    json: IWidget;
}

export type IWidgetPage = 'home' | 'supervisor' | 'voice' | 'textchat' | 'email' | 'generic';
