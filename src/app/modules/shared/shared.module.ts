import { APP_BASE_HREF, CommonModule, PlatformLocation } from '@angular/common';
import { NgModule } from '@angular/core';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { FuseSharedModule } from '@fuse/shared.module';
import { EditorModule } from '@progress/kendo-angular-editor';
import * as Chart from 'chart.js';
import { ChartsModule } from 'ng2-charts';
import {
    AgentSkillListComponent,
    AlertDialogComponent,
    AppConfirmDialogComponent,
    AppSnackbarComponent,
    AvatarComponent,
    CreateEmailComponent,
    CustomDialogComponent,
    MailboxSettingsComponent,
    NoDataAvailableComponent,
    PreviewEmailComponent,
    ReminderTaskDialogComponent,
    ResourceNotFoundComponent,
    SharedWrapperComponent,
    SkeletonComponent,
    SnackbarComponent,
    TableComponent,
    TextTemplatesComponent,
    WidgetFabComponent
} from './components';
import { EmailModule } from './components/email/email.module';
import { TWChartDirective } from './directives';
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
const sharedModules = [MaterialModule, FuseSharedModule, LeafletModule, ChartsModule, PickerModule, EditorModule, EmailModule];

/**
 * Shared components
 */
const sharedComponents = [
    MailboxSettingsComponent,
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
    CreateEmailComponent,
    AgentSkillListComponent,
    PreviewEmailComponent,
    SkeletonComponent,
    SharedWrapperComponent,
    TableComponent,
    TextTemplatesComponent
];

/**
 * Shared module
 */
@NgModule({
    declarations: sharedComponents,
    imports: [CommonModule, ...sharedModules],
    providers: [
        {
            provide: APP_BASE_HREF,
            useFactory: (s: PlatformLocation) => s.getBaseHrefFromDOM(),
            deps: [PlatformLocation]
        }
    ],
    exports: [...sharedModules, ...sharedComponents]
})
export class SharedModule {}
