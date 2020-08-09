import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@modules/shared/shared.module';
import { TwToolbarModule } from '@modules/t-widgets/tw-toolbar/tw-toolbar.module';
import { ToolbarComponent } from 'app/layout/components/toolbar/toolbar.component';


@NgModule({
    declarations: [
        ToolbarComponent
    ],
    imports: [
        RouterModule,
        SharedModule,
        TwToolbarModule,
    ],
    exports: [
        ToolbarComponent
    ]
})
export class ToolbarModule {
}
