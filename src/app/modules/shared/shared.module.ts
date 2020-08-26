import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FuseSharedModule } from '@fuse/shared.module';
import { MaterialModule } from './material.module';
import { ResourceNotFoundComponent } from './resource-not-found/resource-not-found.component';
import { ChartsModule } from 'ng2-charts';
import * as Chart from 'chart.js';
import { TChartDirective } from './directives/t-chart.directive';

Chart.defaults.global.responsive = true;
Chart.defaults.global.maintainAspectRatio = false;

const sharedModules = [MaterialModule, FuseSharedModule, ChartsModule];

const sharedComponents = [ResourceNotFoundComponent, TChartDirective];

@NgModule({
    declarations: sharedComponents,
    imports: [CommonModule, ...sharedModules],
    exports: [...sharedModules, ...sharedComponents]
})
export class SharedModule {}
