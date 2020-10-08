import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { FuseSharedModule } from '@fuse/shared.module';
import * as Chart from 'chart.js';
// import 'chartjs-plugin-piechart-outlabels';
import { ChartsModule } from 'ng2-charts';
import { AlertDialogComponent, AppConfirmDialogComponent, AppSnackbarComponent, AvatarComponent, CreateSmsComponent, CustomDialogComponent, NoDataAvailableComponent, ReminderTaskDialogComponent, ResourceNotFoundComponent, SnackbarComponent, WidgetFabComponent } from './components';
import { QuillDirective, TWChartDirective } from './directives';
import { MaterialModule } from './material.module';

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
const sharedModules = [MaterialModule, FuseSharedModule, LeafletModule, ChartsModule];

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
    CreateSmsComponent,
    NoDataAvailableComponent,
    QuillDirective,
    TWChartDirective
];

/**
 * Shared module
 */
@NgModule({
    declarations: sharedComponents,
    imports: [CommonModule, ...sharedModules],
    exports: [...sharedModules, ...sharedComponents]
})
export class SharedModule { }
