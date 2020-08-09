import { NgModule } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { TwCollectionsModule } from './tw-collections/tw-collections.module';
import { TwContentModule } from './tw-content/tw-content.module';
import { TwTemplateModule } from './tw-template/tw-template.module';
import { TwToolbarModule } from './tw-toolbar/tw-toolbar.module';

const widgetModules = [
    TwToolbarModule,
    TwContentModule,
    TwTemplateModule,
    TwCollectionsModule
];

@NgModule({
    declarations: [
    ],
    imports: [SharedModule, ...widgetModules],
    exports: widgetModules
})

export class TWidgetsModule { }
