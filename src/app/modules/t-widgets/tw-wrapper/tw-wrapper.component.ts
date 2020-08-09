import { Component, OnInit, Input, ViewEncapsulation, OnDestroy } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs/internal/Subject';
import { FuseConfigService } from '@fuse/services/config.service';
@Component({
    selector: 'tw-wrapper',
    templateUrl: './tw-wrapper.component.html',
    styleUrls: ['./tw-wrapper.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwWrapperComponent implements OnInit, OnDestroy {

    @Input() data: any;

    fuseConfig: any;

    // Private
    _unsubscribeAll: Subject<any>;

    constructor(
        private _fuseConfigService: FuseConfigService
    ) {
        this._unsubscribeAll = new Subject();
    }

    ngOnInit(): void {
        // Subscribe to the config changes
        this._fuseConfigService.config
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((fuseConfig: any) => {
                this.fuseConfig = fuseConfig;
            });
    }

    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

}
