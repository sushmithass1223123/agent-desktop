import { NgModule } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { DashboardService } from '@services/dashboard.service';
import { TMACEventService } from '@services/tmac-event.service';
import { TwCollectionsModule } from './tw-collections/tw-collections.module';
import { TwContentModule } from './tw-content/tw-content.module';
import { TwTemplateModule } from './tw-template/tw-template.module';
import { TwToolbarModule } from './tw-toolbar/tw-toolbar.module';
// Import HttpClientModule from @angular/common/http in AppModule
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {UIActionEventService} from '@services/ui-action-event.service';
/**
 * Widgts module list
 */
const widgetModules = [TwToolbarModule, TwContentModule, TwTemplateModule, TwCollectionsModule];

/**
 * Widgets Module
 */
@NgModule({ declarations: [],
    exports: [...widgetModules], imports: [SharedModule, ...widgetModules], providers: [TMACEventService, DashboardService, UIActionEventService, provideHttpClient(withInterceptorsFromDi())] })
export class TWidgetsModule {}
