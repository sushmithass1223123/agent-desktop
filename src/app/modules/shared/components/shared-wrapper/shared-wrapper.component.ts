import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { Subject } from 'rxjs';

/**
 * Shared wrapper component
 */
@Component({
    selector: 'shared-wrapper',
    templateUrl: './shared-wrapper.component.html',
    styleUrls: ['./shared-wrapper.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class SharedWrapperComponent implements OnInit, OnDestroy {
    /**
     * Widget icon
     */
    @Input() icon: string;
    /**
     * Widget title
     */
    @Input() title: string;
    /**
     * Widget title
     */
    @Input() loading: boolean;
    /**
     * Close button ref
     */
    @ViewChild('closeBtn')
    private _closeBtn: MatButton;
    /**
     * To unsubscribe from subscription subject
     */
    unsubscribeAll = new Subject();

    /**
     * Fuse custom background colors
     */
    customFuse$ = this._fuseFacadeService.anchorOrWidgetBgClasses$;

    constructor(
        private _fuseFacadeService: FuseFacadeService
    ) { }

    /**
     * OnInit
     */
    ngOnInit(): void {
    }

    /**
     * OnDestroy
     */
    ngOnDestroy(): void {
        this.unsubscribeAll.next(null);
        this.unsubscribeAll.complete();
    }

    /**
     * To close the dialog
     */
    close(): void {
        this._closeBtn._elementRef.nativeElement.click();
    }
}
