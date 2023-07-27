import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@modules/shared/shared.module';
import { TwToolbarModule } from '@modules/t-widgets/tw-toolbar/tw-toolbar.module';
import { ToolbarComponent } from 'app/layout/components/toolbar/toolbar.component';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { TranslocoRootModule } from '../../../transloco-root.module';
@NgModule({
    declarations: [ToolbarComponent],
    providers: [{
        provide: TRANSLOCO_SCOPE,
        useValue: 'default'
    }],
    imports: [RouterModule, SharedModule, TwToolbarModule,TranslocoRootModule],
    exports: [ToolbarComponent]
})
export class ToolbarModule {}
