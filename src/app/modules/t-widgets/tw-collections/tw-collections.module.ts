import { NgModule } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { TwCustomComponent } from './tw-custom/tw-custom.component';
import { TwSampleComponent } from './tw-sample/tw-sample.component';
import { TwUnknownComponent } from './tw-unknown/tw-unknown.component';
import { TwWrapperModule } from '../tw-wrapper/tw-wrapper.module';

@NgModule({
    declarations: [
        TwCustomComponent,
        TwUnknownComponent,
        TwSampleComponent,
    ],
    imports: [
        SharedModule,
        TwWrapperModule
    ]
})
export class TwCollectionsModule { }
