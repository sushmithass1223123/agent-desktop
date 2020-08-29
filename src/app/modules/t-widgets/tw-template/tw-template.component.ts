import { AfterContentInit, Component, ComponentFactoryResolver, Input, ViewChild } from '@angular/core';
import { TWContentLibrary, TWidget, TWLibrary } from '@twidgets/utils';
import { IWidget } from 'app/interfaces';
import { TwTemplateDirective } from './tw-template.directive';


@Component({
    selector: 'tw-template',
    templateUrl: './tw-template.component.html',
    styleUrls: ['./tw-template.component.scss']
})
export class TwTemplateComponent implements AfterContentInit {

    // widget list loader
    @Input() widgets: IWidget[];

    // single widget loader
    @Input() set widget(widget: IWidget) {
        this.loadComponent(widget);
    }

    @ViewChild(TwTemplateDirective, { static: true }) widgetTemplate: TwTemplateDirective;

    constructor(
        private _componentFactoryResolver: ComponentFactoryResolver
    ) { }

    ngAfterContentInit(): void {
        // loop throught input widgets
        this.widgets?.forEach((widget: IWidget) => {
            // load the components
            this.loadComponent(widget);
        });
    }

    private loadComponent(widgetModel: IWidget): void {
        let widget: TWidget = null;

        // null check
        if (!widgetModel) {
            console.warn('TwTemplateComponent: widget model is null!');
        }

        // get the widget component by type 
        if (widgetModel.Type.startsWith('twc-')) {
            // content type
            widget = TWContentLibrary.getWidget(widgetModel.Type, widgetModel);
        }
        else if (widgetModel.Type.startsWith('tw-')) {
            // basic widget
            widget = TWLibrary.getWidget(widgetModel.Type, widgetModel);
        }
        else {
            console.warn(`TwTemplateComponent: widget type [${widgetModel.Type}] is not supported!`);
            return;
        }

        // console.log(`TwTemplateComponent: ${widget.data.Type}`, widget);

        // create the component factory
        const componentFactory = this._componentFactoryResolver.resolveComponentFactory(widget.component);

        // get the view container reference from widget host
        const viewContainerRef = this.widgetTemplate.viewContainerRef;

        // add the component to the view
        const componentRef = viewContainerRef.createComponent(componentFactory);

        // add the data params
        componentRef.instance.data = widgetModel;
    }

}
