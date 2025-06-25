// dynamic-component.service.ts
import {
    ApplicationRef,
    ComponentFactoryResolver,
    ComponentRef,
    EmbeddedViewRef,
    Injectable,
    Injector,
    Type
} from '@angular/core';
import { SharedWrapper } from '@modules/t-widgets/utils/widget-wrapper/shared-wrapper';

@Injectable({ providedIn: 'root' })
export class DynamicComponentService extends SharedWrapper {
    private activeComponents: Map<string, ComponentRef<any>> = new Map();

    constructor(
        private injector: Injector,
        private appRef: ApplicationRef,
        private componentFactoryResolver: ComponentFactoryResolver
    ) {
        super('DynamicComponentService');
    }

    appendComponentToElement<T extends object>(
        component: Type<T>,
        containerId: string,
        uniqueKey: string,
        inputs?: Partial<T>
    ): ComponentRef<T> | null {
        this.removeComponent(uniqueKey);

        const factory = this.componentFactoryResolver.resolveComponentFactory(component);
        const componentRef = factory.create(this.injector);

        if (inputs) {
            Object.assign(componentRef.instance, inputs);
        }

        this.appRef.attachView(componentRef.hostView);
        componentRef.changeDetectorRef.detectChanges();

        const domElem = (componentRef.hostView as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement;

        const container = document.getElementById(containerId);
        if (container) {
            container.appendChild(domElem);
            this.activeComponents.set(uniqueKey, componentRef);
            return componentRef;
        } else {
            console.warn(`Container with id "${containerId}" not found.`);
            componentRef.destroy();
            return null;
        }
    }

    /**
     * Removes a specific component by key.
     */
    removeComponent(uniqueKey: string): void {
        const componentRef = this.activeComponents.get(uniqueKey);
        if (componentRef) {
            this.appRef.detachView(componentRef.hostView);
            componentRef.destroy();
            this.activeComponents.delete(uniqueKey);
        }
    }

    /**
     * Clears all active components.
     */
    removeAll(): void {
        this.activeComponents.forEach((_ref, key) => this.removeComponent(key));
    }
}
