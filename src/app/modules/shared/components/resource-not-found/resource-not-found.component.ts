import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { FuseSplashScreenService } from '@fuse/services/splash-screen.service';

/**
 * Common resource not found compnent
 */
@Component({
    selector: 'resource-not-found',
    templateUrl: './resource-not-found.component.html',
    styleUrls: ['./resource-not-found.component.scss']
})
export class ResourceNotFoundComponent implements OnInit {
    /**
     * Subtitle
     */
    subtitle: string;
    /**
     * Title
     */
    title: string;
    /**
     * Description
     */
    description: string;
    /**
     * Login flag
     */
    login = true;
    /**
     * To retry same path
     */
    route = '';

    constructor(private _router: Router, private _titleService: Title, private fuseSplashService: FuseSplashScreenService) {}

    /**
     * Lifecycles Hook
     * @method
     */
    ngOnInit(): void {
        this.subtitle = history.state.subtitle || '';
        this.title = history.state.title || '';
        this.description = history.state.description || '';
        this.login = history.state.login ?? true;
        this.route = history.state.route ?? '';
        const title = this._titleService.getTitle();
        this._titleService.setTitle(title.split('-')[0].trim());
    }

    /**
     * Route back to path
     */
    routeBack(): void {
        // we will route to login page
        this._router.navigate([this.route ?? 'login'], { queryParamsHandling: 'preserve' });
    }
}
