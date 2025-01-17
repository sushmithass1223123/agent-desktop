import { SocialMediaPostsModule } from './components/social-media-posts/social-media-posts.module';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { FuseSharedModule } from '@fuse/shared.module';
import { ChartsModule } from '@progress/kendo-angular-charts';
import {Chart} from 'chart.js';
import 'hammerjs';
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
    WidgetFabComponent,
    AnnotationComponent,
    TSnackbarComponent,
    TSnackbarContainer,
    PreviewDialogComponent
} from './components';
import { EmailModule } from './components/email/email.module';
// import { TWChartDirective } from './directives';
import { MaterialModule } from './material.module';
import { CustomDatePipe } from './pipes';
import { TRANSLOCO_SCOPE } from '@jsverse/transloco';
import { TranslocoRootModule } from '../../transloco-root.module';
// Chart.defaults.responsive = true;
// Chart.defaults.plugins.legend.position = 'right';
// Chart.defaults.font.size = 20;
// Chart.defaults.maintainAspectRatio = false;
// Chart.defaults.animation = {
//     duration: 0
// };
// Chart.defaults.animation.duration = 0;
// // Chart.defaults.global.hover.animationDuration = 0;
// Chart.defaults.plugins.legend.display = false;
// Chart.defaults.plugins.legend.labels.font = { size: 15 };
// Chart.defaults.plugins.legend.labels.color = 'black';

/**
 * Shared Modules
 */
const sharedModules = [MaterialModule, FuseSharedModule, LeafletModule, PickerModule, EmailModule, ChartsModule, SocialMediaPostsModule];

/**
 * Shared components
 */
const sharedComponents = [
    CustomDialogComponent,
    ResourceNotFoundComponent,
    //TWChartDirective,
    SnackbarComponent,
    WidgetFabComponent,
    ReminderTaskDialogComponent,
    NoDataAvailableComponent,
    AgentSkillListComponent,
    SharedWrapperComponent,
    TableComponent,
    TextTemplatesComponent,
    CustomDatePipe,
    AnnotationComponent,
    TSnackbarComponent,
    TSnackbarContainer,
    PreviewDialogComponent,
    AlertDialogComponent,
    AppConfirmDialogComponent,
    AppSnackbarComponent,
    AvatarComponent
];

/**
 * Shared module
 */
@NgModule({
    declarations: sharedComponents,
    imports: [...sharedModules,TranslocoRootModule, CommonModule],
    exports: [...sharedModules, ...sharedComponents],
    providers: [{
        provide: TRANSLOCO_SCOPE,
        useValue: 'default'
    }]
    
})
export class SharedModule { }
