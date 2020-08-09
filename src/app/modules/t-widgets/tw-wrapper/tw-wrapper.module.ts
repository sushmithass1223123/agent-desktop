import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { TwCardHeaderComponent } from './tw-card-header/tw-card-header.component';
import { TwCardComponent } from './tw-card/tw-card.component';
import { TwWrapperComponent } from './tw-wrapper.component';
import { TwWrapperDirective } from './tw-wrapper.directive';



@NgModule({
    declarations: [TwWrapperDirective, TwWrapperComponent, TwCardComponent, TwCardHeaderComponent],
    imports: [
        CommonModule,
        SharedModule
    ],
    exports: [
        TwWrapperDirective, TwWrapperComponent, TwCardComponent, TwCardHeaderComponent
    ]
})
export class TwWrapperModule { }
