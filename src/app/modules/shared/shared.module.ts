import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { FuseSharedModule } from '@fuse/shared.module';
// import { NgxChartsModule } from '@swimlane/ngx-charts';
import * as Chart from 'chart.js';
// import 'chartjs-plugin-piechart-outlabels';
import { ChartsModule } from 'ng2-charts';
import { AlertDialogComponent } from './alert-dialog/alert-dialog.component';
import { AvatarComponent } from './avatar/avatar.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { CreateSmsComponent } from './create-sms/create-sms.component';
import { TWChartDirective } from './directives/tw-chart.directive';
import { MaterialModule } from './material.module';
import { RemiderTaskDialogComponent } from './remider-task-dialog/remider-task-dialog.component';
import { ResourceNotFoundComponent } from './resource-not-found/resource-not-found.component';
import { SnackbarComponent } from './snackbar/snackbar.component';
import { WidgetFabComponent } from './widget-fab/widget-fab.component';

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

const sharedModules = [MaterialModule, FuseSharedModule, LeafletModule, ChartsModule];

const sharedComponents = [
    ResourceNotFoundComponent,
    ConfirmDialogComponent,
    AvatarComponent,
    TWChartDirective,
    SnackbarComponent,
    WidgetFabComponent,
    AlertDialogComponent,
    RemiderTaskDialogComponent,
    CreateSmsComponent
];

@NgModule({
    declarations: sharedComponents,
    imports: [CommonModule, ...sharedModules],
    exports: [...sharedModules, ...sharedComponents]
})
export class SharedModule { }
