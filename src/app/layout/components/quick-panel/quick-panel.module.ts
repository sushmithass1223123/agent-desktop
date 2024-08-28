import { NgModule } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { QuickPanelComponent } from 'app/layout/components/quick-panel/quick-panel.component';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { TranslocoRootModule } from '../../../transloco-root.module';

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
    providers: [{
        provide: TRANSLOCO_SCOPE,
        useValue: 'default'
    }],
    imports: [SharedModule,TranslocoRootModule],
    exports: [QuickPanelComponent]
})
export class QuickPanelModule {}
