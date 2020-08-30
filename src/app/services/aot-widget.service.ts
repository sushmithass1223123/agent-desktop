import { Injectable } from '@angular/core';
import { IWidget } from 'app/interfaces';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppDataService } from './app-data.service';

@Injectable({
    providedIn: 'root'
})
export class AotWidgetService {

    // Private
    private _widgetsSubject: BehaviorSubject<IWidget[]>;

    constructor(
        _appDataService: AppDataService
    ) {
        // init the subject
        this._widgetsSubject = new BehaviorSubject([]);
        // get the config and check for AOT widgets
        _appDataService.config
            .subscribe(
                (config: any) => {
                    // get the AOT widgets
                    const widgets = config.Main.AOT.Widgets;
                    // check if widgets are there, if so load it
                    widgets.forEach((widget: IWidget) => {
                        this.addWidget(widget);
                    });
                }
            );
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
     * To add a new AOT widget
     * @param widget widget model
     */
    addWidget(widget: IWidget): void {

        // check if the widget is null
        if (!widget) {
            return;
        }

        // get the value from the behavior subject
        const widgetList = this._widgetsSubject.getValue();

        // push the new content
        widgetList.push(widget);

        // notify the observers
        this._widgetsSubject.next(widgetList);
    }

    /**
     * To destroy a AOT widget
     * @param id id of the widget
     */
    public destroyWidget(id: string): void {

        // check if the id is null
        if (!id) {
            return;
        }

        // get the value from the behavior subject
        let widgetList = this._widgetsSubject.getValue();
        const currentCount = widgetList.length;

        // if there are no widgets for this id return
        if (currentCount === 0) {
            return;
        }

        // remove the widget
        widgetList = this._widgetsSubject.getValue().filter(w => w.ID !== id);

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
}
