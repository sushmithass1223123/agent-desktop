import { HostBinding, ElementRef, Directive } from '@angular/core';
import { ContentPageService } from '@services/content-page.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Directive()
// tslint:disable-next-line: directive-class-suffix
export class TWContentWrapper {

    @HostBinding('class') class = 'twc-card animate__animated animate__zoomIn animate__faster';
    @HostBinding('style') style = '';

    widgetData: any;

    unsubscribeAll: Subject<any>;

    constructor(
        public hostElement: ElementRef,
        public contentPageService: ContentPageService
    ) {
        // Set the unsubscribeAll defaults
        this.unsubscribeAll = new Subject();
    }

    initWrapper(data: any): void {
        // check if the data is null
        if (!data) {
            console.warn('TWContentWrapper: data us null');
            return;
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
                }
            });
    }

    destroyWrapper(): void {
        // Unsubscribe from all subscriptions
        this.unsubscribeAll.next();
        this.unsubscribeAll.complete();
    }

    onActive = () => { };
}
