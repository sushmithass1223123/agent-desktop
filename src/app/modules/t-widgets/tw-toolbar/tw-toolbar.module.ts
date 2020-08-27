import { NgModule } from '@angular/core';
import { TwActiveInteractionsComponent } from './tw-active-interactions/tw-active-interactions.component';
import { TwAgentDetailsComponent } from './tw-agent-details/tw-agent-details.component';
import { TwAuxCodesComponent } from './tw-aux-codes/tw-aux-codes.component';
import { TwAuxTimerComponent } from './tw-aux-timer/tw-aux-timer.component';
import { TwToolbarMenuComponent } from './tw-toolbar-menu/tw-toolbar-menu.component';
import { SharedModule } from '@modules/shared/shared.module';

const toolbarComponents = [
    TwActiveInteractionsComponent,
    TwAgentDetailsComponent,
    TwAuxCodesComponent,
    TwAuxTimerComponent,
    TwToolbarMenuComponent
];

@NgModule({
    declarations: toolbarComponents,
    imports: [
        SharedModule
    ],
    exports: toolbarComponents
})
export class TwToolbarModule { }
