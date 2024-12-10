import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar';

import { FuseProgressBarComponent } from './progress-bar.component';

@NgModule({
    declarations: [FuseProgressBarComponent],
    imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatProgressBarModule],
    exports: [FuseProgressBarComponent]
})
export class FuseProgressBarModule {}
