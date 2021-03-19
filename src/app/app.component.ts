import { Platform } from '@angular/cdk/platform';
import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseTranslationLoaderService } from '@fuse/services/translation-loader.service';
import { FuseConfig } from '@fuse/types';
import { TranslateService } from '@ngx-translate/core';
import { AppUiService } from '@services/app-ui.service';
import { locale as navigationEnglish } from 'app/navigation/i18n/en';
import { locale as navigationTurkish } from 'app/navigation/i18n/tr';
import { navigation } from 'app/navigation/navigation';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SDKClient } from 'tmac-sdk';
import { environment } from '../environments/environment';

// declare global
declare global {
    interface Window {
        /**
         * SDK Client global
         */
        SDKClient: typeof SDKClient;
    }
}

/**
 * App / root component
 */
@Component({
    selector: 'app',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
    /**
     * fuse Config data
     */
    fuseConfig: FuseConfig;
    /**
     * Need more Description
     * Navigation
     */
    navigation: any;
    /**
     * Custom icon list
     */
    customIconList = [
        {
            label: 'custom-whatsapp',
            name: 'whatsapp'
        },
        {
            label: 'custom-line',
            name: 'line'
        },
        {
            label: 'custom-fb',
            name: 'fb'
        },
        {
            label: 'custom-viber',
            name: 'viber'
        },
        {
            label: 'custom-we',
            name: 'we'
        },
        {
            label: 'custom-telegram',
            name: 'telegram'
        },
        {
            label: 'custom-twitter',
            name: 'twitter'
        }
    ];

    /**
     * Unsubscribe all subject
     */
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {DOCUMENT} document
     * @param {FuseConfigService} _fuseConfigService
     * @param {FuseNavigationService} _fuseNavigationService
     * @param {FuseSidebarService} _fuseSidebarService
     * @param {FuseTranslationLoaderService} _fuseTranslationLoaderService
     * @param {Platform} _platform
     * @param {TranslateService} _translateService
     * @param {AppUiService} _appUIService
     * @param {MatIconRegistry} _matIconRegistry
     * @param {DomSanitizer} _domSanitizer
     */
    constructor(
        @Inject(DOCUMENT) private document: any,
        private _fuseConfigService: FuseConfigService,
        private _fuseNavigationService: FuseNavigationService,
        private _fuseTranslationLoaderService: FuseTranslationLoaderService,
        private _platform: Platform,
        private _translateService: TranslateService,
        private _appUIService: AppUiService,
        private _matIconRegistry: MatIconRegistry,
        private _domSanitizer: DomSanitizer
    ) // private route: ActivatedRoute
    {
        // Get default navigation
        this.navigation = navigation;

        // Register the navigation to the service
        this._fuseNavigationService.register('main', this.navigation);

        // Set the main navigation as our current navigation
        this._fuseNavigationService.setCurrentNavigation('main');

        // Add languages
        this._translateService.addLangs(['en', 'tr']);

        // Set the default language
        this._translateService.setDefaultLang('en');

        // Set the navigation translations
        this._fuseTranslationLoaderService.loadTranslations(navigationEnglish, navigationTurkish);

        // Use a language
        this._translateService.use('en');

        /**
         * ----------------------------------------------------------------------------------------------------
         * ngxTranslate Fix Start
         * ----------------------------------------------------------------------------------------------------
         */

        /**
         * If you are using a language other than the default one, i.e. Turkish in this case,
         * you may encounter an issue where some of the components are not actually being
         * translated when your app first initialized.
         *
         * This is related to ngxTranslate module and below there is a temporary fix while we
         * are moving the multi language implementation over to the Angular's core language
         * service.
         */

        // Set the default language to 'en' and then back to 'tr'.
        // '.use' cannot be used here as ngxTranslate won't switch to a language that's already
        // been selected and there is no way to force it, so we overcome the issue by switching
        // the default language back and forth.
        /**
         * setTimeout(() => {
         * this._translateService.setDefaultLang('en');
         * this._translateService.setDefaultLang('tr');
         * });
         */

        /**
         * ----------------------------------------------------------------------------------------------------
         * ngxTranslate Fix End
         * ----------------------------------------------------------------------------------------------------
         */

        // Add is-mobile class to the body if the platform is mobile
        if (this._platform.ANDROID || this._platform.IOS) {
            this.document.body.classList.add('is-mobile');
        }

        // Set the private defaults
        this._unsubscribeAll = new Subject();

        // add the custom icons to iconRegistry
        this.customIconList.forEach((icon) => {
            this._matIconRegistry.addSvgIcon(icon.label, this._domSanitizer.bypassSecurityTrustResourceUrl(`assets/icons/custom/${icon.name}.svg`));
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // do not load config for preview page
        if (location.pathname.includes('preview')) {
            return;
        }

        // this.route.queryParams
        //     .pipe(
        //         takeUntil(this._unsubscribeAll),
        //         filter((params) => params.w || params.h)
        //     )
        //     .subscribe((params) => {
        //         window.resizeTo(params.w || window.screen.width, params.h || window.screen.height);
        //     });

        // subscribe to app ui service
        this._appUIService.subscribe();

        // Subscribe to config changes
        this._fuseConfigService.config.pipe(takeUntil(this._unsubscribeAll)).subscribe((config: any) => {
            this.fuseConfig = config;

            // Boxed
            if (this.fuseConfig.layout.width === 'boxed') {
                this.document.body.classList.add('boxed');
            } else {
                this.document.body.classList.remove('boxed');
            }

            // Color theme - Use normal for loop for IE11 compatibility
            // tslint:disable-next-line: prefer-for-of
            for (let i = 0; i < this.document.body.classList.length; i++) {
                const className = this.document.body.classList[i];

                if (className.startsWith('theme-')) {
                    this.document.body.classList.remove(className);
                }
            }

            // add the updated theme color
            this.document.body.classList.add(this.fuseConfig.colorTheme);

            // Web font - Use normal for loop for IE11 compatibility
            // tslint:disable-next-line: prefer-for-of
            for (let i = 0; i < this.document.body.classList.length; i++) {
                const className = this.document.body.classList[i];

                if (className.startsWith('wf-')) {
                    this.document.body.classList.remove(className);
                }
            }

            // check if webFont is provided
            if (this.fuseConfig.webFont) {
                // add the update web font
                this.document.body.classList.add(this.fuseConfig.webFont);
            }
        });


        // check the environment and set window variable
        if (!environment.production) {
            // set a global variable to access SDK client on development mode
            window.SDKClient = SDKClient;
        }
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();

        // subscribe to app ui service
        this._appUIService.unsubscribe();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------
}
