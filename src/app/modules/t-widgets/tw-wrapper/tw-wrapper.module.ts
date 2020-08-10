import { NgModule } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { TwCardHeaderComponent } from './tw-card-header/tw-card-header.component';
import { TwCardComponent } from './tw-card/tw-card.component';
import { TwWrapperComponent } from './tw-wrapper.component';

@NgModule({
    declarations: [
        TwCardComponent,
        TwCardHeaderComponent,

        TwWrapperComponent
    ],
    imports: [
        SharedModule
    ],
    exports: [
        TwWrapperComponent
    ]
})
export class TwWrapperModule { }
