import { NgModule } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { QuickPanelComponent } from 'app/layout/components/quick-panel/quick-panel.component';

/**
 * Need More Description
 * Quick Panel Component
 */
@NgModule({
    declarations: [
        /**
         * Quick panel Component
         */
        QuickPanelComponent
    ],
    imports: [
        SharedModule
    ],
    exports: [
        QuickPanelComponent
    ]
})
export class QuickPanelModule {
}
