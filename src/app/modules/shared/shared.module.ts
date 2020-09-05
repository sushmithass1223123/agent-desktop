import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { FuseSharedModule } from '@fuse/shared.module';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import * as Chart from 'chart.js';
import { ChartsModule } from 'ng2-charts';
import { AvatarComponent } from './avatar/avatar.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { TWChartDirective } from './directives/tw-chart.directive';
import { MaterialModule } from './material.module';
import { ResourceNotFoundComponent } from './resource-not-found/resource-not-found.component';
import { SnackbarComponent } from './snackbar/snackbar.component';
import { WidgetFabComponent } from './widget-fab/widget-fab.component';
import 'chartjs-plugin-piechart-outlabels';

Chart.defaults.global.responsive = true;
Chart.defaults.global.legend.position = 'right';
Chart.defaults.global.maintainAspectRatio = false;
Chart.defaults.global.animation = {
    duration: 0
};
Chart.defaults.global.responsiveAnimationDuration = 0;
Chart.defaults.global.hover.animationDuration = 0;
Chart.defaults.global.plugins = {
    outlabels: { display: false, backgroundColor: null, font: { size: 15 }, color: 'black' }
};

const sharedModules = [
    MaterialModule,
    FuseSharedModule,
    LeafletModule,
    ChartsModule,
    NgxChartsModule
];

const sharedComponents = [
    ResourceNotFoundComponent,
    ConfirmDialogComponent,
    AvatarComponent,
    TWChartDirective,
    SnackbarComponent,
    WidgetFabComponent
];

@NgModule({
    declarations: sharedComponents,
    imports: [CommonModule, ...sharedModules],
    exports: [...sharedModules, ...sharedComponents]
})
export class SharedModule { }
