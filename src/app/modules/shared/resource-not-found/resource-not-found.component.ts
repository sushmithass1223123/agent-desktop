import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'resource-not-found',
    templateUrl: './resource-not-found.component.html',
    styleUrls: ['./resource-not-found.component.scss']
})
export class ResourceNotFoundComponent implements OnInit {

    subtitle: string;
    title: string;
    description: string;
    login: boolean;

    constructor(private _router: Router) { }

    ngOnInit(): void {
        this.subtitle = history.state.subtitle || '';
        this.title = history.state.title || '';
        this.description = history.state.description || '';
        this.login = history.state.login || false;
    }

    routeToLogin(): void {
        // we will route to login page
        this._router.navigate(['login']);
    }

}
