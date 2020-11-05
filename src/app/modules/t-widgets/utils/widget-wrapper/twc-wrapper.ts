import { Directive, ElementRef, HostBinding, HostListener, Input } from '@angular/core';
import { ContentPageService } from '@services/content-page.service';
import { IWidget } from 'app/interfaces';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TUtils } from 'tmac-sdk';

/**
 * TW content wrapper directive
 */
@Directive()
// tslint:disable-next-line: directive-class-suffix
export class TWContentWrapper {
    /**
     * Host binding for class
     */
    @HostBinding('class') class = 'twc-card animate__animated animate__fadeIn animate__faster';
    /**
     * Host binding for style
     */
    @HostBinding('style') style = '';
    /**
     * Host binding for id
     */
    @HostBinding('id') id = '';
    /**
     * Holds all the data related to this widget from the config
     */
    @Input() data: IWidget;
    /**
     * Screen height
     */
    screenHeight: number;
    /**
     * Screen width
     */
    screenWidth: number;
    /**
     * Holds all widget's custom data
     */
    widgetData: any;
    /**
     * Subject to unsubscribe
     */
    unsubscribeAll: Subject<any>;
    /**
     * Page active flag
     */
    pageActive: boolean;
    /**
     * To listen to the window resize
     */
    @HostListener('window:resize', ['$event'])
    onResize(): void {
        this.setWidthHeight();
    }

    constructor(
        public hostElement: ElementRef,
        public contentPageService: ContentPageService
    ) {
        // set the unsubscribeAll defaults
        this.unsubscribeAll = new Subject();
        this.pageActive = false;
        this.setWidthHeight();
    }

    /**
     * To set width/height
     */
    private setWidthHeight(): void {
        this.screenHeight = window.innerHeight - 100;
        this.screenWidth = window.innerWidth >= 599 ? window.innerWidth - 100 : window.innerWidth;
    }

    /**
     * On widget init
     *  
     * @param {IWidget} data Widget data
     */
    initWrapper(data: IWidget): void {
        // check if the data is null
        if (!data) {
            console.warn('TWContentWrapper: data us null');
            return;
        }

        // check if any id is appended, if not add here
        if (!data.ID) {
            // get new id from uuid
            data.ID = TUtils.Generic.uuid();
            // append id to the tag
            this.id = data.ID;
        }

        // add display none to the host element
        this.hostElement.nativeElement.style.display = 'none';

        // set the data
        this.widgetData = data;

        // Check if the position is defined
        if (data.Config.Position) {
            // check if X positon is defined
            if (data.Config.Position.X) {
                this.style = `${this.style} grid-row: span ${data.Config.Position.X} / auto;`;
            }
            // check if Y positon is defined
            if (data.Config.Position.Y) {
                this.style = `${this.style} grid-column: span ${data.Config.Position.Y} / auto;`;
            }
        }

        // check if the Class is defined
        if (data.Config.Class) {
            // add the postion class
            this.class += ' ' + data.Config.Class;
        }

        // subscribe to the viewModeObservable
        this.contentPageService.mode
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((d: string) => {
                // get the path
                const active = d === this.widgetData.Data.Path;
                // set the style
                this.hostElement.nativeElement.style.display = (active ? 'block' : 'none');
                // check if active, then trigger event
                if (active) {
                    this.onActive();
                    this.pageActive = true;
                }
                else {
                    this.onInactive();
                    this.pageActive = false;
                }
            });
    }

    /**
     * On widget destroy
     */
    destroyWrapper(): void {
        // Unsubscribe from all subscriptions
        this.unsubscribeAll.next();
        this.unsubscribeAll.complete();
    }

    /**
     * On page active callback
     */
    onActive = () => { };

    /**
     * On page inactive callback
     */
    onInactive = () => { };

}
