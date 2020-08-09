import { NgModule } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { TwTemplateDirective } from './tw-template.directive';
import { TwTemplateComponent } from './tw-template.component';

@NgModule({
    declarations: [
        TwTemplateDirective,
        TwTemplateComponent
    ],
    imports: [
        SharedModule
    ], exports: [
        TwTemplateComponent,
        TwTemplateDirective
    ]
})
export class TwTemplateModule { }
