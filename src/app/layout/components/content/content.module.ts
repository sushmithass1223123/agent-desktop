import { NgModule } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { TWidgetsModule } from '@modules/t-widgets/t-widgets.module';
import { ContentComponent } from 'app/layout/components/content/content.component';

@NgModule({
    declarations: [
        ContentComponent
    ],
    imports: [
        SharedModule,
        TWidgetsModule
    ],
    exports: [
        ContentComponent
    ]
})
export class ContentModule {
}
