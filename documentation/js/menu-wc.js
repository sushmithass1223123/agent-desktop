'use strict';


customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">agent-desktop documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                        <li class="link">
                            <a href="license.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>LICENSE
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-toggle="collapse" ${ isNormalMode ?
                                'data-target="#modules-links"' : 'data-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link">AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-AppModule-32d1abfb3b75592bfc80d816720e226a"' : 'data-target="#xs-components-links-module-AppModule-32d1abfb3b75592bfc80d816720e226a"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AppModule-32d1abfb3b75592bfc80d816720e226a"' :
                                            'id="xs-components-links-module-AppModule-32d1abfb3b75592bfc80d816720e226a"' }>
                                            <li class="link">
                                                <a href="components/AppComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">AppComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-AppModule-32d1abfb3b75592bfc80d816720e226a"' : 'data-target="#xs-injectables-links-module-AppModule-32d1abfb3b75592bfc80d816720e226a"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AppModule-32d1abfb3b75592bfc80d816720e226a"' :
                                        'id="xs-injectables-links-module-AppModule-32d1abfb3b75592bfc80d816720e226a"' }>
                                        <li class="link">
                                            <a href="injectables/AOTWidgetService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>AOTWidgetService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/AgentFeaturesService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>AgentFeaturesService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/AppDataService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>AppDataService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/InteractionManagerService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>InteractionManagerService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AppRoutingModule.html" data-type="entity-link">AppRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/AppThemeOptionsModule.html" data-type="entity-link">AppThemeOptionsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-AppThemeOptionsModule-8615dc5689a979c6a5857d8e716f98d5"' : 'data-target="#xs-components-links-module-AppThemeOptionsModule-8615dc5689a979c6a5857d8e716f98d5"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AppThemeOptionsModule-8615dc5689a979c6a5857d8e716f98d5"' :
                                            'id="xs-components-links-module-AppThemeOptionsModule-8615dc5689a979c6a5857d8e716f98d5"' }>
                                            <li class="link">
                                                <a href="components/AppThemeOptionsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">AppThemeOptionsComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/ContentModule.html" data-type="entity-link">ContentModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-ContentModule-b826e045293eb9a9113c24fdc271c54a"' : 'data-target="#xs-components-links-module-ContentModule-b826e045293eb9a9113c24fdc271c54a"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-ContentModule-b826e045293eb9a9113c24fdc271c54a"' :
                                            'id="xs-components-links-module-ContentModule-b826e045293eb9a9113c24fdc271c54a"' }>
                                            <li class="link">
                                                <a href="components/ContentComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ContentComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/CoreModule.html" data-type="entity-link">CoreModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-CoreModule-d25813359d911c5cc2cd08cf87cf6a3f"' : 'data-target="#xs-components-links-module-CoreModule-d25813359d911c5cc2cd08cf87cf6a3f"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-CoreModule-d25813359d911c5cc2cd08cf87cf6a3f"' :
                                            'id="xs-components-links-module-CoreModule-d25813359d911c5cc2cd08cf87cf6a3f"' }>
                                            <li class="link">
                                                <a href="components/LoginComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">LoginComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MainComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">MainComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/WidgetPreviewComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">WidgetPreviewComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/FooterModule.html" data-type="entity-link">FooterModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-FooterModule-7adfe5e93345f649df32cbe9ed00e695"' : 'data-target="#xs-components-links-module-FooterModule-7adfe5e93345f649df32cbe9ed00e695"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-FooterModule-7adfe5e93345f649df32cbe9ed00e695"' :
                                            'id="xs-components-links-module-FooterModule-7adfe5e93345f649df32cbe9ed00e695"' }>
                                            <li class="link">
                                                <a href="components/FooterComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">FooterComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/FuseConfirmDialogModule.html" data-type="entity-link">FuseConfirmDialogModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-FuseConfirmDialogModule-603c5cd11dca69ff35d7eee5bc4375b9"' : 'data-target="#xs-components-links-module-FuseConfirmDialogModule-603c5cd11dca69ff35d7eee5bc4375b9"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-FuseConfirmDialogModule-603c5cd11dca69ff35d7eee5bc4375b9"' :
                                            'id="xs-components-links-module-FuseConfirmDialogModule-603c5cd11dca69ff35d7eee5bc4375b9"' }>
                                            <li class="link">
                                                <a href="components/FuseConfirmDialogComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">FuseConfirmDialogComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/FuseCountdownModule.html" data-type="entity-link">FuseCountdownModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-FuseCountdownModule-38e2e7c17bbd4372917765bc6a04ea91"' : 'data-target="#xs-components-links-module-FuseCountdownModule-38e2e7c17bbd4372917765bc6a04ea91"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-FuseCountdownModule-38e2e7c17bbd4372917765bc6a04ea91"' :
                                            'id="xs-components-links-module-FuseCountdownModule-38e2e7c17bbd4372917765bc6a04ea91"' }>
                                            <li class="link">
                                                <a href="components/FuseCountdownComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">FuseCountdownComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/FuseDemoModule.html" data-type="entity-link">FuseDemoModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-FuseDemoModule-db0854a0e12c3833b24532dac9980d4a"' : 'data-target="#xs-components-links-module-FuseDemoModule-db0854a0e12c3833b24532dac9980d4a"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-FuseDemoModule-db0854a0e12c3833b24532dac9980d4a"' :
                                            'id="xs-components-links-module-FuseDemoModule-db0854a0e12c3833b24532dac9980d4a"' }>
                                            <li class="link">
                                                <a href="components/FuseDemoContentComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">FuseDemoContentComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/FuseDemoSidebarComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">FuseDemoSidebarComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/FuseDirectivesModule.html" data-type="entity-link">FuseDirectivesModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#directives-links-module-FuseDirectivesModule-7786d1a608c37a033584e2ffb727e16b"' : 'data-target="#xs-directives-links-module-FuseDirectivesModule-7786d1a608c37a033584e2ffb727e16b"' }>
                                        <span class="icon ion-md-code-working"></span>
                                        <span>Directives</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="directives-links-module-FuseDirectivesModule-7786d1a608c37a033584e2ffb727e16b"' :
                                        'id="xs-directives-links-module-FuseDirectivesModule-7786d1a608c37a033584e2ffb727e16b"' }>
                                        <li class="link">
                                            <a href="directives/FuseIfOnDomDirective.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules">FuseIfOnDomDirective</a>
                                        </li>
                                        <li class="link">
                                            <a href="directives/FuseInnerScrollDirective.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules">FuseInnerScrollDirective</a>
                                        </li>
                                        <li class="link">
                                            <a href="directives/FuseMatSidenavHelperDirective.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules">FuseMatSidenavHelperDirective</a>
                                        </li>
                                        <li class="link">
                                            <a href="directives/FuseMatSidenavTogglerDirective.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules">FuseMatSidenavTogglerDirective</a>
                                        </li>
                                        <li class="link">
                                            <a href="directives/FusePerfectScrollbarDirective.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules">FusePerfectScrollbarDirective</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/FuseHighlightModule.html" data-type="entity-link">FuseHighlightModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-FuseHighlightModule-0ca70589c2fdf831208e92037785ce2b"' : 'data-target="#xs-components-links-module-FuseHighlightModule-0ca70589c2fdf831208e92037785ce2b"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-FuseHighlightModule-0ca70589c2fdf831208e92037785ce2b"' :
                                            'id="xs-components-links-module-FuseHighlightModule-0ca70589c2fdf831208e92037785ce2b"' }>
                                            <li class="link">
                                                <a href="components/FuseHighlightComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">FuseHighlightComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/FuseMaterialColorPickerModule.html" data-type="entity-link">FuseMaterialColorPickerModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-FuseMaterialColorPickerModule-4b3a7771bf77f71629db963eded5084e"' : 'data-target="#xs-components-links-module-FuseMaterialColorPickerModule-4b3a7771bf77f71629db963eded5084e"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-FuseMaterialColorPickerModule-4b3a7771bf77f71629db963eded5084e"' :
                                            'id="xs-components-links-module-FuseMaterialColorPickerModule-4b3a7771bf77f71629db963eded5084e"' }>
                                            <li class="link">
                                                <a href="components/FuseMaterialColorPickerComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">FuseMaterialColorPickerComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/FuseModule.html" data-type="entity-link">FuseModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/FuseNavigationModule.html" data-type="entity-link">FuseNavigationModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-FuseNavigationModule-55759d341d05a9fe578517f9cebe6db1"' : 'data-target="#xs-components-links-module-FuseNavigationModule-55759d341d05a9fe578517f9cebe6db1"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-FuseNavigationModule-55759d341d05a9fe578517f9cebe6db1"' :
                                            'id="xs-components-links-module-FuseNavigationModule-55759d341d05a9fe578517f9cebe6db1"' }>
                                            <li class="link">
                                                <a href="components/FuseNavHorizontalCollapsableComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">FuseNavHorizontalCollapsableComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/FuseNavHorizontalItemComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">FuseNavHorizontalItemComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/FuseNavVerticalCollapsableComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">FuseNavVerticalCollapsableComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/FuseNavVerticalGroupComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">FuseNavVerticalGroupComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/FuseNavVerticalItemComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">FuseNavVerticalItemComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/FuseNavigationComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">FuseNavigationComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/FusePipesModule.html" data-type="entity-link">FusePipesModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#pipes-links-module-FusePipesModule-7493c4213ddbb24fdb3c43a72759d1c9"' : 'data-target="#xs-pipes-links-module-FusePipesModule-7493c4213ddbb24fdb3c43a72759d1c9"' }>
                                            <span class="icon ion-md-add"></span>
                                            <span>Pipes</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="pipes-links-module-FusePipesModule-7493c4213ddbb24fdb3c43a72759d1c9"' :
                                            'id="xs-pipes-links-module-FusePipesModule-7493c4213ddbb24fdb3c43a72759d1c9"' }>
                                            <li class="link">
                                                <a href="pipes/CamelCaseToDashPipe.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">CamelCaseToDashPipe</a>
                                            </li>
                                            <li class="link">
                                                <a href="pipes/FilterPipe.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">FilterPipe</a>
                                            </li>
                                            <li class="link">
                                                <a href="pipes/GetByIdPipe.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">GetByIdPipe</a>
                                            </li>
                                            <li class="link">
                                                <a href="pipes/HtmlToPlaintextPipe.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">HtmlToPlaintextPipe</a>
                                            </li>
                                            <li class="link">
                                                <a href="pipes/KeysPipe.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">KeysPipe</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/FuseProgressBarModule.html" data-type="entity-link">FuseProgressBarModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-FuseProgressBarModule-792a765b7342387b65a689a6b002a23b"' : 'data-target="#xs-components-links-module-FuseProgressBarModule-792a765b7342387b65a689a6b002a23b"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-FuseProgressBarModule-792a765b7342387b65a689a6b002a23b"' :
                                            'id="xs-components-links-module-FuseProgressBarModule-792a765b7342387b65a689a6b002a23b"' }>
                                            <li class="link">
                                                <a href="components/FuseProgressBarComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">FuseProgressBarComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/FuseSearchBarModule.html" data-type="entity-link">FuseSearchBarModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-FuseSearchBarModule-78a6bd9c0b2ef42ad8141122fed9d23c"' : 'data-target="#xs-components-links-module-FuseSearchBarModule-78a6bd9c0b2ef42ad8141122fed9d23c"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-FuseSearchBarModule-78a6bd9c0b2ef42ad8141122fed9d23c"' :
                                            'id="xs-components-links-module-FuseSearchBarModule-78a6bd9c0b2ef42ad8141122fed9d23c"' }>
                                            <li class="link">
                                                <a href="components/FuseSearchBarComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">FuseSearchBarComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/FuseSharedModule.html" data-type="entity-link">FuseSharedModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/FuseShortcutsModule.html" data-type="entity-link">FuseShortcutsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-FuseShortcutsModule-71c1cbe36fcae74f41883a95e36b60ed"' : 'data-target="#xs-components-links-module-FuseShortcutsModule-71c1cbe36fcae74f41883a95e36b60ed"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-FuseShortcutsModule-71c1cbe36fcae74f41883a95e36b60ed"' :
                                            'id="xs-components-links-module-FuseShortcutsModule-71c1cbe36fcae74f41883a95e36b60ed"' }>
                                            <li class="link">
                                                <a href="components/FuseShortcutsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">FuseShortcutsComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/FuseSidebarModule.html" data-type="entity-link">FuseSidebarModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-FuseSidebarModule-ec4f494ece504c7406beb922bb4a8abb"' : 'data-target="#xs-components-links-module-FuseSidebarModule-ec4f494ece504c7406beb922bb4a8abb"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-FuseSidebarModule-ec4f494ece504c7406beb922bb4a8abb"' :
                                            'id="xs-components-links-module-FuseSidebarModule-ec4f494ece504c7406beb922bb4a8abb"' }>
                                            <li class="link">
                                                <a href="components/FuseSidebarComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">FuseSidebarComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/FuseThemeOptionsModule.html" data-type="entity-link">FuseThemeOptionsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-FuseThemeOptionsModule-1feb93e73127e6355c855c5d8864fcb4"' : 'data-target="#xs-components-links-module-FuseThemeOptionsModule-1feb93e73127e6355c855c5d8864fcb4"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-FuseThemeOptionsModule-1feb93e73127e6355c855c5d8864fcb4"' :
                                            'id="xs-components-links-module-FuseThemeOptionsModule-1feb93e73127e6355c855c5d8864fcb4"' }>
                                            <li class="link">
                                                <a href="components/FuseThemeOptionsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">FuseThemeOptionsComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/FuseWidgetModule.html" data-type="entity-link">FuseWidgetModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-FuseWidgetModule-16783d71ae4c71f6179a91e9b42e6d75"' : 'data-target="#xs-components-links-module-FuseWidgetModule-16783d71ae4c71f6179a91e9b42e6d75"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-FuseWidgetModule-16783d71ae4c71f6179a91e9b42e6d75"' :
                                            'id="xs-components-links-module-FuseWidgetModule-16783d71ae4c71f6179a91e9b42e6d75"' }>
                                            <li class="link">
                                                <a href="components/FuseWidgetComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">FuseWidgetComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#directives-links-module-FuseWidgetModule-16783d71ae4c71f6179a91e9b42e6d75"' : 'data-target="#xs-directives-links-module-FuseWidgetModule-16783d71ae4c71f6179a91e9b42e6d75"' }>
                                        <span class="icon ion-md-code-working"></span>
                                        <span>Directives</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="directives-links-module-FuseWidgetModule-16783d71ae4c71f6179a91e9b42e6d75"' :
                                        'id="xs-directives-links-module-FuseWidgetModule-16783d71ae4c71f6179a91e9b42e6d75"' }>
                                        <li class="link">
                                            <a href="directives/FuseWidgetToggleDirective.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules">FuseWidgetToggleDirective</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/HorizontalLayout1Module.html" data-type="entity-link">HorizontalLayout1Module</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-HorizontalLayout1Module-76d6633021c86cda484b382325883622"' : 'data-target="#xs-components-links-module-HorizontalLayout1Module-76d6633021c86cda484b382325883622"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-HorizontalLayout1Module-76d6633021c86cda484b382325883622"' :
                                            'id="xs-components-links-module-HorizontalLayout1Module-76d6633021c86cda484b382325883622"' }>
                                            <li class="link">
                                                <a href="components/HorizontalLayout1Component.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">HorizontalLayout1Component</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/InstantMessagingModule.html" data-type="entity-link">InstantMessagingModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-InstantMessagingModule-5fac8ea1b7b7903c88242ba8c7dd3fbb"' : 'data-target="#xs-components-links-module-InstantMessagingModule-5fac8ea1b7b7903c88242ba8c7dd3fbb"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-InstantMessagingModule-5fac8ea1b7b7903c88242ba8c7dd3fbb"' :
                                            'id="xs-components-links-module-InstantMessagingModule-5fac8ea1b7b7903c88242ba8c7dd3fbb"' }>
                                            <li class="link">
                                                <a href="components/InstantMessagingComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">InstantMessagingComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-InstantMessagingModule-5fac8ea1b7b7903c88242ba8c7dd3fbb"' : 'data-target="#xs-injectables-links-module-InstantMessagingModule-5fac8ea1b7b7903c88242ba8c7dd3fbb"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-InstantMessagingModule-5fac8ea1b7b7903c88242ba8c7dd3fbb"' :
                                        'id="xs-injectables-links-module-InstantMessagingModule-5fac8ea1b7b7903c88242ba8c7dd3fbb"' }>
                                        <li class="link">
                                            <a href="injectables/InstantMessagingService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>InstantMessagingService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/LayoutModule.html" data-type="entity-link">LayoutModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/MaterialModule.html" data-type="entity-link">MaterialModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/NavbarModule.html" data-type="entity-link">NavbarModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-NavbarModule-1ef15cffa3530f678223cd9778516d7d"' : 'data-target="#xs-components-links-module-NavbarModule-1ef15cffa3530f678223cd9778516d7d"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-NavbarModule-1ef15cffa3530f678223cd9778516d7d"' :
                                            'id="xs-components-links-module-NavbarModule-1ef15cffa3530f678223cd9778516d7d"' }>
                                            <li class="link">
                                                <a href="components/NavbarComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">NavbarComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/QuickPanelModule.html" data-type="entity-link">QuickPanelModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-QuickPanelModule-1667b09cd58d9616a52692d3b8dadd55"' : 'data-target="#xs-components-links-module-QuickPanelModule-1667b09cd58d9616a52692d3b8dadd55"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-QuickPanelModule-1667b09cd58d9616a52692d3b8dadd55"' :
                                            'id="xs-components-links-module-QuickPanelModule-1667b09cd58d9616a52692d3b8dadd55"' }>
                                            <li class="link">
                                                <a href="components/QuickPanelComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">QuickPanelComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/SharedModule.html" data-type="entity-link">SharedModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/ToolbarModule.html" data-type="entity-link">ToolbarModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-ToolbarModule-63eee974fa4bc4037c193e52ab1292e9"' : 'data-target="#xs-components-links-module-ToolbarModule-63eee974fa4bc4037c193e52ab1292e9"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-ToolbarModule-63eee974fa4bc4037c193e52ab1292e9"' :
                                            'id="xs-components-links-module-ToolbarModule-63eee974fa4bc4037c193e52ab1292e9"' }>
                                            <li class="link">
                                                <a href="components/ToolbarComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ToolbarComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/TwCollectionsModule.html" data-type="entity-link">TwCollectionsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-TwCollectionsModule-4165dbe8a9983bfa11f4ac71e7da952c"' : 'data-target="#xs-components-links-module-TwCollectionsModule-4165dbe8a9983bfa11f4ac71e7da952c"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-TwCollectionsModule-4165dbe8a9983bfa11f4ac71e7da952c"' :
                                            'id="xs-components-links-module-TwCollectionsModule-4165dbe8a9983bfa11f4ac71e7da952c"' }>
                                            <li class="link">
                                                <a href="components/RaceCarTrackComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">RaceCarTrackComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwAccountInformationComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwAccountInformationComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwAdCallbacksComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwAdCallbacksComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwAdFeedbackComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwAdFeedbackComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwAdGamificationComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwAdGamificationComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwAdInteractionDetailsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwAdInteractionDetailsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwAdPerformanceComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwAdPerformanceComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwAdScoreComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwAdScoreComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwAdTotalInteractionsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwAdTotalInteractionsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwAgentAssistComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwAgentAssistComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwAhtTcComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwAhtTcComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwAmdocsBccComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwAmdocsBccComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwAudioControlsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwAudioControlsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwAuxStatusChartComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwAuxStatusChartComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwCannedResponsesComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwCannedResponsesComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwChatControlsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwChatControlsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwChatPanelComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwChatPanelComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwCustomComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwCustomComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwCustomerDetailsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwCustomerDetailsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwCustomerJourneyComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwCustomerJourneyComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwCustomerSentimentComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwCustomerSentimentComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwEmailControlsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwEmailControlsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwEmailPanelComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwEmailPanelComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwGamificationComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwGamificationComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwPanelComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwPanelComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwPendingCallbacksComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwPendingCallbacksComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwPieChartComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwPieChartComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwRegisterCallbackComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwRegisterCallbackComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwSampleComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwSampleComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwSuActiveAgentsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwSuActiveAgentsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwSuAgentActivityComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwSuAgentActivityComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwSuAgentActivityDetailsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwSuAgentActivityDetailsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwSuAgentInteractionsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwSuAgentInteractionsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwSuCallsInQueueComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwSuCallsInQueueComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwSuChannelsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwSuChannelsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwSuGamificationComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwSuGamificationComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwSuIntentListComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwSuIntentListComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwSuStatusComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwSuStatusComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwTransferInteractionComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwTransferInteractionComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwUnknownComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwUnknownComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwVideoControlsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwVideoControlsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwVoiceBotTranscriptsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwVoiceBotTranscriptsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwVoiceCannedResponsesComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwVoiceCannedResponsesComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwVoiceControlsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwVoiceControlsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwVoicePanelComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwVoicePanelComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwWallboardComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwWallboardComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwWorkCodesComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwWorkCodesComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwWorkbenchPanelComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwWorkbenchPanelComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/WorkbenchEmailComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">WorkbenchEmailComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/TwContentModule.html" data-type="entity-link">TwContentModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-TwContentModule-e177e3165573ac512c019eabcc8bcc64"' : 'data-target="#xs-components-links-module-TwContentModule-e177e3165573ac512c019eabcc8bcc64"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-TwContentModule-e177e3165573ac512c019eabcc8bcc64"' :
                                            'id="xs-components-links-module-TwContentModule-e177e3165573ac512c019eabcc8bcc64"' }>
                                            <li class="link">
                                                <a href="components/TwcCustomComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwcCustomComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwcEmailComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwcEmailComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwcHomeComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwcHomeComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwcNoInteractionComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwcNoInteractionComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwcNoWidgetsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwcNoWidgetsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwcSupervisorComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwcSupervisorComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwcTextchatComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwcTextchatComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwcUnknownComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwcUnknownComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwcVoiceComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwcVoiceComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwcWorkbenchComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwcWorkbenchComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/TWidgetsModule.html" data-type="entity-link">TWidgetsModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-TWidgetsModule-277cd2122872cd371f891c0da9243f8b"' : 'data-target="#xs-injectables-links-module-TWidgetsModule-277cd2122872cd371f891c0da9243f8b"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-TWidgetsModule-277cd2122872cd371f891c0da9243f8b"' :
                                        'id="xs-injectables-links-module-TWidgetsModule-277cd2122872cd371f891c0da9243f8b"' }>
                                        <li class="link">
                                            <a href="injectables/DashboardService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>DashboardService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/TMACEventService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>TMACEventService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/TwTemplateModule.html" data-type="entity-link">TwTemplateModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-TwTemplateModule-78615855103bbac9a936fce29d3b2fa3"' : 'data-target="#xs-components-links-module-TwTemplateModule-78615855103bbac9a936fce29d3b2fa3"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-TwTemplateModule-78615855103bbac9a936fce29d3b2fa3"' :
                                            'id="xs-components-links-module-TwTemplateModule-78615855103bbac9a936fce29d3b2fa3"' }>
                                            <li class="link">
                                                <a href="components/TwTemplateComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwTemplateComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#directives-links-module-TwTemplateModule-78615855103bbac9a936fce29d3b2fa3"' : 'data-target="#xs-directives-links-module-TwTemplateModule-78615855103bbac9a936fce29d3b2fa3"' }>
                                        <span class="icon ion-md-code-working"></span>
                                        <span>Directives</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="directives-links-module-TwTemplateModule-78615855103bbac9a936fce29d3b2fa3"' :
                                        'id="xs-directives-links-module-TwTemplateModule-78615855103bbac9a936fce29d3b2fa3"' }>
                                        <li class="link">
                                            <a href="directives/TwTemplateDirective.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwTemplateDirective</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/TwToolbarModule.html" data-type="entity-link">TwToolbarModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-TwToolbarModule-226df83a0b13019e15fa8c521ff6e1e7"' : 'data-target="#xs-components-links-module-TwToolbarModule-226df83a0b13019e15fa8c521ff6e1e7"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-TwToolbarModule-226df83a0b13019e15fa8c521ff6e1e7"' :
                                            'id="xs-components-links-module-TwToolbarModule-226df83a0b13019e15fa8c521ff6e1e7"' }>
                                            <li class="link">
                                                <a href="components/TwActiveInteractionsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwActiveInteractionsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwAgentDetailsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwAgentDetailsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwAuxCodesComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwAuxCodesComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwAuxTimerComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwAuxTimerComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwBroadcastComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwBroadcastComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwCreateInteractionComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwCreateInteractionComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwInstantMessagingComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwInstantMessagingComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwLogoutComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwLogoutComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwNotificationsComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwNotificationsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwToolbarMenuComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwToolbarMenuComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/TwWrapperModule.html" data-type="entity-link">TwWrapperModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-TwWrapperModule-17dc10822986d342e512f0f0ccc69b59"' : 'data-target="#xs-components-links-module-TwWrapperModule-17dc10822986d342e512f0f0ccc69b59"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-TwWrapperModule-17dc10822986d342e512f0f0ccc69b59"' :
                                            'id="xs-components-links-module-TwWrapperModule-17dc10822986d342e512f0f0ccc69b59"' }>
                                            <li class="link">
                                                <a href="components/TwCardComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwCardComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwCardHeaderComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwCardHeaderComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TwWrapperComponent.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">TwWrapperComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/VerticalLayout1Module.html" data-type="entity-link">VerticalLayout1Module</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-VerticalLayout1Module-79b7ed2aa51a8e9a97c6dd8415ffcc53"' : 'data-target="#xs-components-links-module-VerticalLayout1Module-79b7ed2aa51a8e9a97c6dd8415ffcc53"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-VerticalLayout1Module-79b7ed2aa51a8e9a97c6dd8415ffcc53"' :
                                            'id="xs-components-links-module-VerticalLayout1Module-79b7ed2aa51a8e9a97c6dd8415ffcc53"' }>
                                            <li class="link">
                                                <a href="components/VerticalLayout1Component.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">VerticalLayout1Component</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#components-links"' :
                            'data-target="#xs-components-links"' }>
                            <span class="icon ion-md-cog"></span>
                            <span>Components</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="components-links"' : 'id="xs-components-links"' }>
                            <li class="link">
                                <a href="components/AlertDialogComponent.html" data-type="entity-link">AlertDialogComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AppConfirmDialogComponent.html" data-type="entity-link">AppConfirmDialogComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AppSnackbarComponent.html" data-type="entity-link">AppSnackbarComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AvatarComponent.html" data-type="entity-link">AvatarComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CreateSmsComponent.html" data-type="entity-link">CreateSmsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CustomDialogComponent.html" data-type="entity-link">CustomDialogComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/FooterComponent.html" data-type="entity-link">FooterComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/NavbarComponent.html" data-type="entity-link">NavbarComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/NoDataAvailableComponent.html" data-type="entity-link">NoDataAvailableComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ReminderTaskDialogComponent.html" data-type="entity-link">ReminderTaskDialogComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ResourceNotFoundComponent.html" data-type="entity-link">ResourceNotFoundComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SnackbarComponent.html" data-type="entity-link">SnackbarComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/WidgetFabComponent.html" data-type="entity-link">WidgetFabComponent</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#directives-links"' :
                                'data-target="#xs-directives-links"' }>
                                <span class="icon ion-md-code-working"></span>
                                <span>Directives</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="directives-links"' : 'id="xs-directives-links"' }>
                                <li class="link">
                                    <a href="directives/FuseIfOnDomDirective.html" data-type="entity-link">FuseIfOnDomDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/FuseInnerScrollDirective.html" data-type="entity-link">FuseInnerScrollDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/FuseMatSidenavHelperDirective.html" data-type="entity-link">FuseMatSidenavHelperDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/FuseMatSidenavTogglerDirective.html" data-type="entity-link">FuseMatSidenavTogglerDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/FusePerfectScrollbarDirective.html" data-type="entity-link">FusePerfectScrollbarDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/QuillDirective.html" data-type="entity-link">QuillDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/TWChartDirective.html" data-type="entity-link">TWChartDirective</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#classes-links"' :
                            'data-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/FusePage.html" data-type="entity-link">FusePage</a>
                            </li>
                            <li class="link">
                                <a href="classes/FusePerfectScrollbarGeometry.html" data-type="entity-link">FusePerfectScrollbarGeometry</a>
                            </li>
                            <li class="link">
                                <a href="classes/FusePerfectScrollbarPosition.html" data-type="entity-link">FusePerfectScrollbarPosition</a>
                            </li>
                            <li class="link">
                                <a href="classes/FuseUtils.html" data-type="entity-link">FuseUtils</a>
                            </li>
                            <li class="link">
                                <a href="classes/MatColors.html" data-type="entity-link">MatColors</a>
                            </li>
                            <li class="link">
                                <a href="classes/ThemeSelector.html" data-type="entity-link">ThemeSelector</a>
                            </li>
                            <li class="link">
                                <a href="classes/TWContentLibrary.html" data-type="entity-link">TWContentLibrary</a>
                            </li>
                            <li class="link">
                                <a href="classes/TWidget.html" data-type="entity-link">TWidget</a>
                            </li>
                            <li class="link">
                                <a href="classes/TWLibrary.html" data-type="entity-link">TWLibrary</a>
                            </li>
                            <li class="link">
                                <a href="classes/TwWidgetModel.html" data-type="entity-link">TwWidgetModel</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#injectables-links"' :
                                'data-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/AgentFeaturesService.html" data-type="entity-link">AgentFeaturesService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AOTWidgetService.html" data-type="entity-link">AOTWidgetService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AppDataService.html" data-type="entity-link">AppDataService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AppUiService.html" data-type="entity-link">AppUiService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ContentPageService.html" data-type="entity-link">ContentPageService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DashboardService.html" data-type="entity-link">DashboardService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FuseConfigService.html" data-type="entity-link">FuseConfigService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FuseCopierService.html" data-type="entity-link">FuseCopierService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FuseMatchMediaService.html" data-type="entity-link">FuseMatchMediaService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FuseMatSidenavHelperService.html" data-type="entity-link">FuseMatSidenavHelperService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FuseNavigationService.html" data-type="entity-link">FuseNavigationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FuseProgressBarService.html" data-type="entity-link">FuseProgressBarService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FuseSidebarService.html" data-type="entity-link">FuseSidebarService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FuseSplashScreenService.html" data-type="entity-link">FuseSplashScreenService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FuseTranslationLoaderService.html" data-type="entity-link">FuseTranslationLoaderService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/InstantMessagingService.html" data-type="entity-link">InstantMessagingService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/InteractionManagerService.html" data-type="entity-link">InteractionManagerService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TMACEventService.html" data-type="entity-link">TMACEventService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#interfaces-links"' :
                            'data-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/ActiveInteraction.html" data-type="entity-link">ActiveInteraction</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AppAlertDialogData.html" data-type="entity-link">AppAlertDialogData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AppConfirmDialogData.html" data-type="entity-link">AppConfirmDialogData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AppNotification.html" data-type="entity-link">AppNotification</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AppSnackBarArgs.html" data-type="entity-link">AppSnackBarArgs</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Chat.html" data-type="entity-link">Chat</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ChatTranscripts.html" data-type="entity-link">ChatTranscripts</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Contact.html" data-type="entity-link">Contact</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CustomDialogData.html" data-type="entity-link">CustomDialogData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CustomerInfo.html" data-type="entity-link">CustomerInfo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FuseConfig.html" data-type="entity-link">FuseConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FuseNavigation.html" data-type="entity-link">FuseNavigation</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FuseNavigationItem.html" data-type="entity-link">FuseNavigationItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ILoginData.html" data-type="entity-link">ILoginData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/InteractionCount.html" data-type="entity-link">InteractionCount</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/InteractionRef.html" data-type="entity-link">InteractionRef</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/InteractionWidgets.html" data-type="entity-link">InteractionWidgets</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IWidget.html" data-type="entity-link">IWidget</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IWidgetConfig.html" data-type="entity-link">IWidgetConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IWidgetPosition.html" data-type="entity-link">IWidgetPosition</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Locale.html" data-type="entity-link">Locale</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/QuizEvent.html" data-type="entity-link">QuizEvent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/QuizEventJsonData.html" data-type="entity-link">QuizEventJsonData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ReminderTaskDialogData.html" data-type="entity-link">ReminderTaskDialogData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ReqCampaignContact.html" data-type="entity-link">ReqCampaignContact</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ResCampaign.html" data-type="entity-link">ResCampaign</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ResData.html" data-type="entity-link">ResData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ResGamification.html" data-type="entity-link">ResGamification</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ResGamificationBadge.html" data-type="entity-link">ResGamificationBadge</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ResLoadWorkCodes.html" data-type="entity-link">ResLoadWorkCodes</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TwChartConfig.html" data-type="entity-link">TwChartConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TWChartPieceLabel.html" data-type="entity-link">TWChartPieceLabel</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Window.html" data-type="entity-link">Window</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#miscellaneous-links"'
                            : 'data-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>
                        </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});