import { AfterContentInit, Component, ComponentFactoryResolver, Input, ViewChild } from '@angular/core';
import { TWidget } from '@twidgets/utils';
import { TwTemplateDirective } from './tw-template.directive';


@Component({
    selector: 'tw-template',
    templateUrl: './tw-template.component.html',
    styleUrls: ['./tw-template.component.scss']
})
export class TwTemplateComponent implements AfterContentInit {

    @Input() widgets: TWidget[];

    @ViewChild(TwTemplateDirective, { static: true }) widgetTemplate: TwTemplateDirective;

    constructor(
        private _componentFactoryResolver: ComponentFactoryResolver
    ) { }

    ngAfterContentInit(): void {
        // load the components
        this.loadComponent();
    }

    private loadComponent(): void {
        // loop throught input widgets
        this.widgets.forEach((widget) => {

            console.log(`TwTemplateComponent: ${widget.data.Type}`, widget);

            // create the component factory
            const componentFactory = this._componentFactoryResolver.resolveComponentFactory(widget.component);

            // get the view container reference from widget host
            const viewContainerRef = this.widgetTemplate.viewContainerRef;

            // add the component to the view
            const componentRef = viewContainerRef.createComponent(componentFactory);

            // add the data params
            componentRef.instance.data = widget.data;
        });
    }

}
