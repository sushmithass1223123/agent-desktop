import { NgModule } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { NavbarComponent } from 'app/layout/components/navbar/navbar.component';

@NgModule({
    declarations: [
        NavbarComponent
    ],
    imports: [
        SharedModule
    ],
    exports: [
        NavbarComponent
    ]
})
export class NavbarModule {
}
