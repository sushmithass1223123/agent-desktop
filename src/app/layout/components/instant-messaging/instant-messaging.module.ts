import { NgModule } from '@angular/core';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatRippleModule } from '@angular/material/core';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';

import { FuseSharedModule } from '@fuse/shared.module';

import { InstantMessagingComponent } from './instant-messaging.component';
import { InstantMessagingService } from './instant-messaging.service';
import { SharedModule } from '@modules/shared/shared.module';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { TranslocoRootModule } from '../../../transloco-root.module';


/**
 * Instant messaging component
 */
@NgModule({
    declarations: [InstantMessagingComponent],
    providers: [InstantMessagingService, {
        provide: TRANSLOCO_SCOPE,
        useValue: 'default'
    }],
    imports: [
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatTabsModule,
        MatTooltipModule,
        MatRippleModule,
        FuseSharedModule,
        SharedModule,
        TranslocoRootModule
    ],
    exports: [InstantMessagingComponent]
})
export class InstantMessagingModule {}
