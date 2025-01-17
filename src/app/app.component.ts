import { Platform } from '@angular/cdk/platform';
import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { FuseConfig } from '@fuse/types';
import { AppDataService } from '@services/app-data.service';
import { AppUiService } from '@services/app-ui.service';
import { FuseFacadeService } from '@services/fuse-facade.service';
import * as TMACSDK from '@tmac/sdk';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// declare global
declare global {
    interface Window {
        /**
         * SDK Client global
         */
        __TMACSDK: typeof TMACSDK;
    }
}
@Component({
  selector: 'app',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
    /**
     * Custom icon list
     */
  customIconList = [
    {
        label: 'custom-whatsapp',
        name: 'whatsapp'
    },
    {
        label: 'custom-whatsapp_infomedia',
        name: 'whatsapp_infomedia'
    },
    {
        label: 'custom-whatsapp_meta',
        name: 'whatsapp_meta'
    },
    {
        label: 'custom-instagram',
        name: 'instagram'
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
    },
    {
        label: 'custom-file-default',
        name: 'file-default'
    },
    {
        label: 'custom-file-image',
        name: 'file-image'
    },
    {
        label: 'custom-file-audio',
        name: 'file-audio'
    },
    {
        label: 'custom-file-text',
        name: 'file-text'
    },
    {
        label: 'custom-file-excel',
        name: 'file-excel'
    },
    {
        label: 'custom-file-pdf',
        name: 'file-pdf'
    },
    {
        label: 'custom-file-ppt',
        name: 'file-ppt'
    },
    {
        label: 'custom-file-video',
        name: 'file-video'
    },
    {
        label: 'custom-file-word',
        name: 'file-word'
    },
    {
        label: 'custom-file-zip',
        name: 'file-zip'
    },
    {
        label: 'custom-cobrowse',
        name: 'cobrowse'
    },
    {
        label: 'custom-smfb',
        name: 'smfb'
    },
    {
        label: 'custom-smtwitter',
        name: 'smtwitter'
    },
    {
        label: 'custom-sminstagram',
        name: 'sminstagram'
    }
];

/**
 * Unsubscribe all subject
 */
private _unsubscribeAll: Subject<any>;

/**
     * Constructor
     *
     */
constructor(
  @Inject(DOCUMENT) private document: any,
  private _fuseFacadeService: FuseFacadeService,
  private _platform: Platform,
  private _appUIService: AppUiService,
  private _matIconRegistry: MatIconRegistry,
  private _domSanitizer: DomSanitizer,
  private _appDataService: AppDataService
  ) {
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

    // TODO: screen resolution zoom
        // // for desktop zoom based on display resolutions
        // if (!(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))) {
        //     // check the display resolutions
        //     switch (screen.height) {
        //         case 1050:
        //         case 1024:
        //             document.body.style.zoom = 0.90;
        //             break;
        //         case 900:
        //             document.body.style.zoom = 0.80;
        //             break;
        //         case 800:
        //             document.body.style.zoom = 0.67;
        //             break;
        //         default:
        //             if (screen.height <= 768) {
        //                 document.body.style.zoom = 0.67;
        //             }
        //             break;
        //     }
        // }
  }

  // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
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

      // Subscribe to custom fuse config changes
      this._fuseFacadeService
          .getConfig()
          .pipe(takeUntil(this._unsubscribeAll))
          .subscribe((config: Partial<FuseConfig>) => {
              // Boxed
              if (config.layout?.width === 'boxed') {
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
              this.document.body.classList.add(config.colorTheme);

              // Web font - Use normal for loop for IE11 compatibility
              // tslint:disable-next-line: prefer-for-of
              for (let i = 0; i < this.document.body.classList.length; i++) {
                  const className = this.document.body.classList[i];

                  if (className.startsWith('wf-')) {
                      this.document.body.classList.remove(className);
                  }
              }

              // check if webFont is provided
              if (config.webFont) {
                  // add the update web font
                  this.document.body.classList.add(config.webFont);
              }
          });

      // set a global variable to access SDK client on development mode
      window.__TMACSDK = TMACSDK;

      // log the app version
      console.log(`App Version: ${this._appDataService.getAppVersion()}`);
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
      // Unsubscribe from all subscriptions
      this._unsubscribeAll.next(null);
      this._unsubscribeAll.complete();

      // subscribe to app ui service
      this._appUIService.unsubscribe();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Private methods
  // -----------------------------------------------------------------------------------------------------
}
