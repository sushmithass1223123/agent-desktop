import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { FlexLayoutModule } from 'ngx-flexible-layout';
import { FuseProgressBarComponent } from './progress-bar.component';

@NgModule({
    declarations: [FuseProgressBarComponent],
    imports: [CommonModule, RouterModule, FlexLayoutModule, MatButtonModule, MatIconModule, MatProgressBarModule],
    exports: [FuseProgressBarComponent]
})
export class FuseProgressBarModule {}
