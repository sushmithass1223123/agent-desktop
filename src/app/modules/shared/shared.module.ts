import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { FuseSharedModule } from '@fuse/shared.module';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import * as Chart from 'chart.js';
import { ChartsModule } from 'ng2-charts';
import { AvatarComponent } from './avatar/avatar.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { TChartDirective } from './directives/t-chart.directive';
import { MaterialModule } from './material.module';
import { ResourceNotFoundComponent } from './resource-not-found/resource-not-found.component';

Chart.defaults.global.responsive = true;
Chart.defaults.global.maintainAspectRatio = false;
Chart.defaults.global.elements = {
    rectangle: {
        borderWidth: 0
    },
    arc: {
        borderWidth: 0
    }
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
    TChartDirective
];

@NgModule({
    declarations: sharedComponents,
    imports: [CommonModule, ...sharedModules],
    exports: [...sharedModules, ...sharedComponents]
})
export class SharedModule { }
