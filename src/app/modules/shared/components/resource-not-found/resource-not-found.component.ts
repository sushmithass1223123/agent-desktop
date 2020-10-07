import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

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

    constructor(private _router: Router) { }

    /**
     * Lifecycles Hook
     * @method
     */
    ngOnInit(): void {
        this.subtitle = history.state.subtitle || '';
        this.title = history.state.title || '';
        this.description = history.state.description || '';
        this.login = history.state.login || true;
    }

    /**
     * Route to login
     */
    routeToLogin(): void {
        // we will route to login page
        this._router.navigate(['login']);
    }

}
