import { DOCUMENT } from '@angular/common';
import { Component, HostBinding, Inject, OnDestroy, OnInit, Renderer2, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { fuseAnimations } from '@fuse/animations';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { FuseConfig } from '@fuse/types';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { getFuseConfigByTheme } from 'app/utils';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Need more Description
 * Theme options Component
 */
@Component({
    selector: 'app-theme-options',
    templateUrl: './theme-options.component.html',
    styleUrls: ['./theme-options.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class AppThemeOptionsComponent implements OnInit, OnDestroy {
    /**
     * Fuse config
     */
    // fuseConfig:FuseConfig;

    /**
     * Fuse layout style
     */
    layoutStyle = '';

    /**
     * Form group
     */
    form: FormGroup;

    /**
     * Bar closed host binding
     */
    @HostBinding('class.bar-closed')
    barClosed: boolean;

    /**
     * Disable custom theme
     */
    disableCustom: boolean;

    // Private

    /**
     * Unsubscribe all subject
     */
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {DOCUMENT} document
     * @param {FormBuilder} _formBuilder
     * @param {FuseFacadeService} _fuseFacadeService
     * @param {FuseSidebarService} _fuseSidebarService
     * @param {Renderer2} _renderer
     */
    constructor(
        @Inject(DOCUMENT) private document: any,
        private _formBuilder: FormBuilder,
        private _fuseFacadeService: FuseFacadeService,
        private _fuseSidebarService: FuseSidebarService,
        private _renderer: Renderer2
    ) {
        // Set the defaults
        this.barClosed = true;
        this.disableCustom = false;

        // Set the private defaults
        this._unsubscribeAll = new Subject();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Build the config form
        // noinspection TypeScriptValidateTypes
        this.form = this._formBuilder.group({
            colorTheme: new FormControl(),
            webFont: new FormControl(),
            flatTheme: new FormControl(),
            customScrollbars: new FormControl(),
            layout: this._formBuilder.group({
                style: new FormControl(),
                width: new FormControl(),
                navbar: this._formBuilder.group({
                    customBackgroundColor: new FormControl(),
                    background: new FormControl(),
                    folded: new FormControl(),
                    hidden: new FormControl(),
                    position: new FormControl(),
                    variant: new FormControl()
                }),
                toolbar: this._formBuilder.group({
                    background: new FormControl(),
                    customBackgroundColor: new FormControl(),
                    hidden: new FormControl(),
                    position: new FormControl()
                }),
                content: this._formBuilder.group({
                    background: new FormControl(),
                    customBackgroundColor: new FormControl()
                }),
                anchorWidget: this._formBuilder.group({
                    customBackgroundColor: new FormControl(),
                    bodyBackground: new FormControl(),
                    headerBackground: new FormControl(),
                    contentBackground: new FormControl()
                }),
                widget: this._formBuilder.group({
                    customBackgroundColor: new FormControl(),
                    bodyBackground: new FormControl(),
                    headerBackground: new FormControl(),
                    contentBackground: new FormControl()
                }),
                footer: this._formBuilder.group({
                    background: new FormControl(),
                    customBackgroundColor: new FormControl(),
                    hidden: new FormControl(),
                    position: new FormControl()
                }),
                sidepanel: this._formBuilder.group({
                    hidden: new FormControl(),
                    position: new FormControl()
                })
            })
        });

        this._fuseFacadeService
            .getConfig()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: FuseConfig) => {
                // assign layout style
                this.layoutStyle = config.layout.style;

                // check if to disable custom
                this.disableCustom = config.colorTheme !== 'theme-default' && config.colorTheme !== 'theme-default-dark';

                // Set the config form values without emitting an event
                // so that we don't end up with an infinite loop
                this.form.setValue(config, { emitEvent: false });
            });

        // // Subscribe to the config changes
        // this._fuseConfigService.config
        //     .pipe(takeUntil(this._unsubscribeAll))
        //     .subscribe((config: FuseConfig) => {

        //         // Update the stored config
        //         this.fuseConfig = config;

        //         // check if to disable custom
        //         this.disableCustom = this.fuseConfig.colorTheme !== 'theme-default' && this.fuseConfig.colorTheme !== 'theme-default-dark';

        //         // Set the config form values without emitting an event
        //         // so that we don't end up with an infinite loop
        //         this.form.setValue(config, { emitEvent: false });
        //     });

        // Subscribe to the specific form value changes (layout.style)
        this.form
            .get('layout.style')
            .valueChanges.pipe(takeUntil(this._unsubscribeAll))
            .subscribe((value) => {
                // Reset the form values based on the
                // selected layout style
                this._resetFormValues(value);
            });

        // Subscribe to the specific form value changes (colorTheme)
        this.form
            .get('colorTheme')
            .valueChanges.pipe(takeUntil(this._unsubscribeAll))
            .subscribe((value) => {
                this.disableCustom = value !== 'theme-default' && value !== 'theme-default-dark';
                // Reset the form values based on the
                // selected layout style
                this._setTheme(value);
            });

        // Subscribe to the form value changes
        this.form.valueChanges.pipe(takeUntil(this._unsubscribeAll)).subscribe((config: FuseConfig) => {
            // Update the config
            // this._fuseConfigService.config = config;
            this._fuseFacadeService.setConfig = config;
        });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Reset the form values based on the
     * selected layout style
     *
     * @param value
     * @private
     */
    private _resetFormValues(value: string): void {
        switch (value) {
            // Vertical Layout
            case 'vertical-layout': {
                this.form.patchValue({
                    layout: {
                        width: 'fullwidth',
                        navbar: {
                            background: 'purple-700',
                            customBackgroundColor: true,
                            folded: false,
                            hidden: false,
                            position: 'left',
                            variant: 'vertical-style-1'
                        },
                        toolbar: {
                            customBackgroundColor: true,
                            background: 'grey-200',
                            hidden: false,
                            position: 'below-fixed'
                        },
                        content: {
                            customBackgroundColor: true,
                            background: 'grey-200'
                        },
                        anchorWidget: {
                            customBackgroundColor: true,
                            bodyBackground: 'purple-A100',
                            headerBackground: 'grey-100',
                            contentBackground: 'grey-100'
                        },
                        widget: {
                            customBackgroundColor: true,
                            bodyBackground: 'grey-A100',
                            headerBackground: 'grey-100',
                            contentBackground: 'grey-100'
                        },
                        footer: {
                            customBackgroundColor: true,
                            background: 'grey-400',
                            hidden: true,
                            position: 'below-static'
                        },
                        sidepanel: {
                            hidden: true,
                            position: 'right'
                        }
                    }
                });

                break;
            }
        }
    }

    /**
     * Set the form theme values based on the
     * selected theme
     *
     * @param value
     * @private
     */
    private _setTheme(value: string): void {
        // get FuseConfig for the theme from selector
        const getTheme = getFuseConfigByTheme(value, true);
        // patch the value to the form
        this.form.patchValue(getTheme);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Toggle sidebar open
     *
     * @param key
     */
    toggleSidebarOpen(key): void {
        this._fuseSidebarService.getSidebar(key).toggleOpen();
    }
}
