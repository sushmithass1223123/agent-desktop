import { APP_BASE_HREF, CommonModule, PlatformLocation } from '@angular/common';
import { NgModule } from '@angular/core';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { FuseSharedModule } from '@fuse/shared.module';
import * as Chart from 'chart.js';
import { ChartsModule } from 'ng2-charts';
import { QuillModule } from 'ngx-quill';
import Quill from 'quill';
import {
    AgentSkillListComponent,
    AlertDialogComponent,
    AppConfirmDialogComponent,
    AppSnackbarComponent,
    AvatarComponent,
    CreateEmailComponent,
    CreateMessagingComponent,
    CustomDialogComponent,
    NoDataAvailableComponent,
    ReminderTaskDialogComponent,
    ResourceNotFoundComponent,
    SharedWrapperComponent,
    SnackbarComponent,
    WidgetFabComponent,
    EmailTemplateSelectorComponent,
    MailboxSettingsComponent
} from './components';
import { TWChartDirective } from './directives';
import { MaterialModule } from './material.module';

const SizeStyle = Quill.import('attributors/style/size');
Quill.register(SizeStyle, true);

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
const sharedModules = [MaterialModule, FuseSharedModule, LeafletModule, ChartsModule, PickerModule];

/**
 * Shared components
 */
const sharedComponents = [
    MailboxSettingsComponent,
    ResourceNotFoundComponent,
    EmailTemplateSelectorComponent,
    CustomDialogComponent,
    AvatarComponent,
    TWChartDirective,
    SnackbarComponent,
    WidgetFabComponent,
    AlertDialogComponent,
    ReminderTaskDialogComponent,
    AppConfirmDialogComponent,
    AppSnackbarComponent,
    CreateMessagingComponent,
    NoDataAvailableComponent,
    TWChartDirective,
    CreateEmailComponent,
    AgentSkillListComponent,
    SharedWrapperComponent
];

/**
 * Shared module
 */
@NgModule({
    declarations: sharedComponents,
    imports: [CommonModule, ...sharedModules, QuillModule.forRoot()],
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
