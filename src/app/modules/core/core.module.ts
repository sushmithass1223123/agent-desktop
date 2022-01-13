import { NgModule } from '@angular/core';
import { LoginModule } from '@modules/core/login/login.module';
import { MainModule } from '@modules/core/main/main.module';
import { SharedModule } from '@modules/shared/shared.module';
import { WidgetPreviewModule } from '@modules/core/widget-preview/widget-preview.module';

@NgModule({
    declarations: [],
    imports: [
        LoginModule,
        MainModule,
        SharedModule,
        WidgetPreviewModule
    ]
})
export class CoreModule { }
