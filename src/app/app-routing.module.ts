import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from '@modules/core/login/login.component';
import { MainComponent } from '@modules/core/main/main.component';
import { WidgetPreviewComponent } from '@modules/core/widget-preview/widget-preview.component';
import { ResourceNotFoundComponent } from '@modules/shared/components';

const appRoutes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    {
        path: 'login',
        children: [
            {
                path: '',
                component: LoginComponent
            },
            {
                path: ':lanId',
                component: LoginComponent
            }
        ]
    },
    { path: 'main', component: MainComponent },
    { path: 'preview', component: WidgetPreviewComponent },
    { path: 'not-found', component: ResourceNotFoundComponent }
];

@NgModule({
    imports: [RouterModule.forRoot(appRoutes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
