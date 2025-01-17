import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { FuseProgressBarModule, FuseSidebarModule } from '@fuse/components';
import { FuseModule } from '@fuse/fuse.module';
import { FuseSharedModule } from '@fuse/shared.module';
import { CoreModule } from '@modules/core/core.module';
import { SharedModule } from '@modules/shared/shared.module';
import { TRANSLOCO_SCOPE } from '@jsverse/transloco';
import { AppComponent } from 'app/app.component';
import { fuseConfig } from 'app/constants';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { TranslocoRootModule } from './transloco-root.module';
/**
 * App module
 */
@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FuseModule.forRoot(fuseConfig),
    FuseProgressBarModule,
    FuseSharedModule,
    FuseSidebarModule,
    CoreModule,
    SharedModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    TranslocoRootModule,
    AppRoutingModule,
    
  ],
  bootstrap: [AppComponent],
  providers: [{
    provide: TRANSLOCO_SCOPE,
    useValue: ''
},provideHttpClient(withInterceptorsFromDi())]
})
export class AppModule { }
