import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

import { FuseSharedModule } from '@fuse/shared.module';

import { InstantMessagingComponent } from './instant-messaging.component';
import { InstantMessagingService } from './instant-messaging.service';
import { SharedModule } from '@modules/shared/shared.module';

/**
 * Instant messaging component
 */
@NgModule({
    declarations: [InstantMessagingComponent],
    providers: [InstantMessagingService],
    imports: [
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatTabsModule,
        MatTooltipModule,
        MatRippleModule,
        FuseSharedModule,
        SharedModule
    ],
    exports: [InstantMessagingComponent]
})
export class InstantMessagingModule {}
