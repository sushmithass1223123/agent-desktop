import { Component, ElementRef, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWContentWrapper } from '@twidgets/utils/widget-wrapper/twc-wrapper';
import { ContentPageService } from '@services/content-page.service';

/**
 * Docker Content Widget Component
 */
@Component({
    selector: 'twc-docker',
    templateUrl: './twc-docker.component.html',
    styleUrls: ['./twc-docker.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcDockerComponent extends TWContentWrapper implements OnInit, OnDestroy {
    /**
     * To hold static widgets
     */
    dockerWidgets = [];
    /**
     * To hold AOT widgets
     */
    aotWidgets = [];
    /**
     * Loaded flag
     */
    loaded: boolean;
    /**
     * Flag to unload the page
     */
    unload: boolean;

    constructor(public hostElement: ElementRef, public contentPageService: ContentPageService) {
        super('TwcDockerComponent', hostElement, contentPageService);
    }

    /**
     * OnInit
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // get the docker content widgets
        this.dockerWidgets = this.data.Data.Widgets.Static || [];
        this.aotWidgets = this.data.Data.Widgets.AOT || [];

        // to unload the page
        this.unload = this.data.Data.Unload || false;
    }

    /**
     * OnDestroy
     */
    ngOnDestroy(): void {
        this.destroyWrapper();
    }

    /**
     * On page active callback
     */
    onActive = () => {
        if (!this.loaded) {
            this.loaded = true;
        }
    };

    /**
     * On page inactive callback
     */
    onInactive = (preservePageContent?: boolean | undefined) => {
        if (this.loaded && this.pageActive) {
            if (this.unload && !preservePageContent) {
                this.loaded = false;
            }
        }
    };
}
