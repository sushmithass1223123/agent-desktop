import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FuseSplashScreenService } from '@fuse/services/splash-screen.service';
import { SharedWrapper } from '@modules/t-widgets/utils/widget-wrapper/shared-wrapper';
import { AppDataService } from '@services/app-data.service';
import { IResponseData, TUtils } from '@tmac/sdk';

/**
 * Widget Preview
 */
@Component({
    selector: 'widget-preview',
    templateUrl: './widget-preview.component.html',
    styleUrls: ['./widget-preview.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class WidgetPreviewComponent extends SharedWrapper implements OnInit {
    /**
     * Widgets
     */
    widgets = [];

    /**
     * Loading state
     */
    loading = true;

    /**
     * App config path
     */
    appConfigPath = 'assets/production.json';

    /**
     * Local template path
     */
    localTemplatePath = 'assets/preview.json';

    /**
     * App config
     */
    appConfig: any;

    constructor(
        private fuseSplashService: FuseSplashScreenService,
        private _activatedRouter: ActivatedRoute,
        private _router: Router,
        private _appDataService: AppDataService
    ) {
        super();
    }

    /**
     * Lifecycle Hook
     */
    async ngOnInit(): Promise<void> {
        await this._appDataService.getJsonConfig('', true);
        // get the config
        const response = await fetch(this.appConfigPath);
        // get the json response
        const config = await response.json();
        // assign the config if found
        if (config) {
            this.appConfig = config;
            // get the query param
            this._activatedRouter.queryParams.subscribe((params) => {
                console.log('WidgetPreviewComponent.queryParams', params);
                // get the template name from the config
                if (params && params.templateName) {
                    // get the template
                    this.getTemplateJson(params.templateName);
                } else {
                    this.routeToNotFound('Template name is not found!');
                }
            });
        } else {
            this.routeToNotFound('Config is not found, please contact administrator!');
        }
    }

    /**
     * Route to 404 page
     * @param {String} message
     */
    private routeToNotFound(message: string): void {
        // route to the not found page
        this._router.navigate(['not-found'], {
            state: {
                subtitle: 'Oops',
                title: '',
                description: message,
                login: false,
                route: 'preview'
            },
            queryParamsHandling: 'preserve'
        });
    }

    /**
     * Get template json
     * @param {String} templateName
     */
    private async getTemplateJson(templateName: string): Promise<void> {
        try {
            // check if local template
            if (templateName === 'local') {
                this.logger.info(`getTemplateJson load local template @ ${this.localTemplatePath}`, false);
                // get the config
                const templateFetch = await fetch(this.localTemplatePath);
                if (!templateFetch.ok) {
                    this.loading = false;
                    return;
                }
                // get the json response
                const template = (await templateFetch.json()) ?? [];
                this.loading = false;
                this.widgets = template;
                return;
            }

            // get the template json
            const result = (await TUtils.HttpClient.sendRequest)({
                urls: [`${this.appConfig.ProxyUrl}/GetWidgetPreviewJson`],
                requestArgs: { id: templateName },
                header: {
                    'Content-Type': 'application/json'
                },
                responseType: 'json',
                method: 'POST'
            });

            setTimeout(
                (x: IResponseData<any>) => {
                    // check the response
                    if (x.response) {
                        this.loading = false;
                        this.widgets = x.response.d ? JSON.parse(x.response.d) : [];
                    } else {
                        this.routeToNotFound('Template name is not found!');
                    }
                },
                1000,
                result
            );
        } catch (error) {
            this.logger.error('Error in getTemplateJson', error, false);
            this.routeToNotFound('Error in getting template');
        }
    }
}
