import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from '@modules/core/login/login.component';
import { MainComponent } from '@modules/core/main/main.component';
import { ResourceNotFoundComponent } from '@modules/shared/resource-not-found/resource-not-found.component';
import { TwPreviewComponent } from '@modules/core/tw-preview/tw-preview.component';

const appRoutes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'main',
        component: MainComponent
    },
    {
        path: 'preview',
        component: TwPreviewComponent
    },
    {
        path: 'not-found',
        component: ResourceNotFoundComponent
    }
];

@NgModule({
    imports: [RouterModule.forRoot(appRoutes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
