import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { FuseProgressBarModule, FuseSidebarModule, FuseThemeOptionsModule } from '@fuse/components';
import { FuseModule } from '@fuse/fuse.module';
import { FuseSharedModule } from '@fuse/shared.module';
import { CoreModule } from '@modules/core/core.module';
import { SharedModule } from '@modules/shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { AotWidgetService } from '@services/aot-widget.service';
import { AppDataService } from '@services/app-data.service';
import { AppComponent } from 'app/app.component';
import { fuseConfig } from 'app/constants';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';

@NgModule({
    declarations: [AppComponent],
    providers: [
        AotWidgetService,
        AppDataService 
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        AppRoutingModule,

        TranslateModule.forRoot(),

        // Fuse modules
        FuseModule.forRoot(fuseConfig),
        FuseProgressBarModule,
        FuseSharedModule,
        FuseSidebarModule,
        FuseThemeOptionsModule,

        // App modules
        CoreModule,
        SharedModule,
        ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
