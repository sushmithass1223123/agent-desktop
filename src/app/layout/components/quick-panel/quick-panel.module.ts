import { NgModule } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { QuickPanelComponent } from 'app/layout/components/quick-panel/quick-panel.component';

@NgModule({
    declarations: [
        QuickPanelComponent
    ],
    imports     : [
SharedModule
    ],
    exports: [
        QuickPanelComponent
    ]
})
export class QuickPanelModule
{
}
