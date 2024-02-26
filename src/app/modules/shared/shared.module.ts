import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { FuseSharedModule } from '@fuse/shared.module';
import { ChartsModule } from '@progress/kendo-angular-charts';
import * as Chart from 'chart.js';
import 'hammerjs';
import { ChartsModule as ng2Charts } from 'ng2-charts';
import {
    AgentSkillListComponent,
    AlertDialogComponent,
    AppConfirmDialogComponent,
    AppSnackbarComponent,
    AvatarComponent,
    CustomDialogComponent,
    NoDataAvailableComponent,
    ReminderTaskDialogComponent,
    ResourceNotFoundComponent,
    SharedWrapperComponent,
    SnackbarComponent,
    TableComponent,
    TextTemplatesComponent,
    WidgetFabComponent
} from './components';
import { EmailModule } from './components/email/email.module';
import { TWChartDirective } from './directives';
import { MaterialModule } from './material.module';
import { CustomDatePipe } from './pipes';

Chart.defaults.global.responsive = true;
Chart.defaults.global.legend.position = 'right';
Chart.defaults.global.legend.labels.fontSize = 20;
Chart.defaults.global.maintainAspectRatio = false;
Chart.defaults.global.animation = {
    duration: 0
};
Chart.defaults.global.responsiveAnimationDuration = 0;
Chart.defaults.global.hover.animationDuration = 0;
Chart.defaults.global.plugins = {
    outlabels: { display: false, backgroundColor: null, font: { size: 15 }, color: 'black' }
};

/**
 * Shared Modules
 */
const sharedModules = [MaterialModule, FuseSharedModule, LeafletModule, ng2Charts, PickerModule, EmailModule, ChartsModule];

/**
 * Shared components
 */
const sharedComponents = [
    ResourceNotFoundComponent,
    CustomDialogComponent,
    AvatarComponent,
    TWChartDirective,
    SnackbarComponent,
    WidgetFabComponent,
    AlertDialogComponent,
    ReminderTaskDialogComponent,
    AppConfirmDialogComponent,
    AppSnackbarComponent,
    NoDataAvailableComponent,
    TWChartDirective,
    AgentSkillListComponent,
    SharedWrapperComponent,
    TableComponent,
    TextTemplatesComponent,
    CustomDatePipe
];

/**
 * Shared module
 */
@NgModule({
    declarations: sharedComponents,
    imports: [CommonModule, ...sharedModules],
    exports: [...sharedModules, ...sharedComponents]
})
export class SharedModule {}
