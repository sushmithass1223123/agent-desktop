import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { cloneDeep } from 'lodash';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Need more Description
 * Layout 1 component
 */
@Component({
    selector: 'vertical-layout',
    templateUrl: './vertical-layout.component.html',
    styleUrls: ['./vertical-layout.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class VerticalLayoutComponent implements OnInit, OnDestroy {
    // fuseConfig: any;

    /**
     * Fuse custom config
     */
    customFuse$: any;

    /**
     * Navigation
     */
    navigation: any;

    // Private
    /**
     * Unsubscribe subject
     */
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {FuseFacadeService} _fuseFacadeService
     */
    constructor(
        // private _fuseConfigService: FuseConfigService
        private _fuseFacadeService: FuseFacadeService
    ) {
        // Set the private defaults
        this._unsubscribeAll = new Subject();

        this.customFuse$ = this._fuseFacadeService.getConfig({ layout: 'layout' }).pipe(
            map((config: any) => {
                const layout = cloneDeep(config.layout);
                const { navbar, toolbar, content, footer, sidepanel } = layout;
    
                navbar.background = layout.navbar.customBackgroundColor ? layout.navbar.background : '';
                navbar.hidden = layout.navbar.hidden;
                navbar.folded = layout.navbar.folded;
                navbar.position = layout.navbar.position;
    
                const toolbarBg = layout.toolbar.customBackgroundColor ? ` ${layout.toolbar.background}` : '';
                toolbar.hidden = layout.toolbar.hidden;
                toolbar.position = layout.toolbar.position;
                toolbar.class = `navbar-${navbar.position} ${toolbar.position}` + toolbarBg;
    
                const contentBg = layout.content.customBackgroundColor ? ` ${layout.content.background}` : '';
                content.class = `navbar-${navbar.position}` + contentBg;
    
                const footerBg = layout.footer.customBackgroundColor ? ` ${layout.footer.background}` : '';
                footer.hidden = layout.footer.hidden;
                footer.position = layout.footer.position;
                footer.class = footer.position + footerBg;
    
                sidepanel.position = layout.sidepanel.position;
    
                return { navbar, toolbar, content, footer, sidepanel };
            })
        );
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Subscribe to config changes
        // this._fuseConfigService.config
        //     .pipe(takeUntil(this._unsubscribeAll))
        //     .subscribe((config: any) => {
        //         this.fuseConfig = config;
        //     });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
