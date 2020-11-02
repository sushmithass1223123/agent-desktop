import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from '@modules/core/login/login.component';
import { MainComponent } from '@modules/core/main/main.component';
import { WidgetPreviewComponent } from '@modules/core/widget-preview/widget-preview.component';
import { ResourceNotFoundComponent } from '@modules/shared/components';

const appRoutes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        children: [
            {
                path: '',
                component: LoginComponent
            },
            {
                path: ':agentId',
                component: LoginComponent
            }
        ]
    },
    {
        path: 'main',
        children: [
            {
                path: '',
                component: MainComponent
            },
            {
                path: ':agentId',
                component: MainComponent
            }
        ]
    },
    {
        path: 'preview',
        component: WidgetPreviewComponent
    },
    {
        path: 'not-found',
        component: ResourceNotFoundComponent
    }
];

/**
 * App routing module
 */
@NgModule({
    imports: [RouterModule.forRoot(appRoutes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
