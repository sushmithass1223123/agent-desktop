import { SmpTemplateComponent } from './smp-template/smp-template.component';
import { APP_BASE_HREF, CommonModule, PlatformLocation } from '@angular/common';
import { WorkbenchSmpComponent } from './workbench-smp/workbench-smp.component';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { TranslocoRootModule } from 'app/transloco-root.module';
import { MaterialModule } from '@modules/shared/material.module';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TRANSLOCO_SCOPE } from '@jsverse/transloco';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { SMPPipe } from './pipes/smp.pipe';
import { FusePipesModule } from '@fuse/pipes/pipes.module';
import { ReadMoreDirective } from './directives/read-more.directive';

const shared = [WorkbenchSmpComponent, SmpTemplateComponent, SMPPipe, ReadMoreDirective];

@NgModule({
    declarations: shared,
    exports: shared,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        BrowserModule,
        TranslocoRootModule,
        MaterialModule,
        ScrollingModule,
        PickerModule,
        FusePipesModule
    ],
    providers: [
        {
            provide: APP_BASE_HREF,
            useFactory: (s: PlatformLocation) => s.getBaseHrefFromDOM(),
            deps: [PlatformLocation]
        },
        {
            provide: TRANSLOCO_SCOPE,
            useValue: 'default'
        }
    ]
})
export class SocialMediaPostsModule {}
