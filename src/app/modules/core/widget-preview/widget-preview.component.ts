import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FuseProgressBarService } from '@fuse/components/progress-bar/progress-bar.service';
import { IResponse, TUtils } from 'tmac-sdk';

@Component({
    selector: 'widget-preview',
    templateUrl: './widget-preview.component.html',
    styleUrls: ['./widget-preview.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class WidgetPreviewComponent implements OnInit {

    previewWidgets = [];
    loading = true;
    appConfigPath = 'assets/app-config.json';
    appConfig: any;

    constructor(
        private _activatedRouter: ActivatedRoute,
        private _router: Router,
        private _fuseProgressBarService: FuseProgressBarService
    ) {
    }

    ngOnInit(): void {
        // get the config
        this.getConfig();
    }

    private async getConfig(): Promise<any> {
        // get the config
        const respnse = await fetch(this.appConfigPath);
        // get the json response
        const config = await respnse.json();
        // assign the config if found
        if (config) {
            this.appConfig = config;
            // get the query param
            this._activatedRouter.queryParams.subscribe(params => {
                TUtils.Logger.console('info', 'WidgetPreviewComponent.queryParams', params);
                // get the template name from the config
                if (params && params.templateName) {
                    // get the template
                    this.getTemplateJson(params.templateName);
                }
                else {
                    this.routeToNotFound('Template name is not found!');
                }
            });
        }
        else {
            this.routeToNotFound('Config is not found, please contact administrator!');
        }
    }

    private routeToNotFound(message: string): void {
        // route to the not found page
        this._router.navigate(['not-found'],
            {
                state: {
                    subtitle: 'Oops',
                    title: '',
                    description: message,
                    login: false
                }
            });
    }

    private async getTemplateJson(templateName: string): Promise<void> {
        try {
            this._fuseProgressBarService.show();
            // get the template json
            const result: IResponse = await TUtils.HttpClient.sendRequest({
                url: `${this.appConfig.ProxyUrl}/GetWidgetPreviewJson`,
                requestArgs: { id: templateName },
                method: 'POST'
            });
            setTimeout(() => {
                this._fuseProgressBarService.hide();
                // check the response
                if (result.response) {
                    // set loading false
                    this.loading = false;
                    // assign the widgets
                    this.previewWidgets = result.response.d ? JSON.parse(result.response.d) : [];
                }
                else {
                    this.routeToNotFound('Template name is not found!');
                }
            }, 1000);
        } catch (error) {
            TUtils.Logger.log('Exception in getTemplateJson', error);
            this.routeToNotFound('Error in getting template');
        }
    }
}
