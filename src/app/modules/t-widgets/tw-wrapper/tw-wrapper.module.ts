import { NgModule } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { TwCardHeaderComponent } from './tw-card-header/tw-card-header.component';
import { TwCardComponent } from './tw-card/tw-card.component';
import { TwWrapperComponent } from './tw-wrapper.component';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { TranslocoRootModule } from '../../../transloco-root.module';

/**
 * Tw Wrapper Module
 */
@NgModule({
    declarations: [TwCardComponent, TwCardHeaderComponent, TwWrapperComponent],
    imports: [SharedModule, TranslocoRootModule],
    providers: [
        {
            provide: TRANSLOCO_SCOPE,
            useValue: 'default'
        }],
    exports: [TwWrapperComponent]
})
export class TwWrapperModule {}
