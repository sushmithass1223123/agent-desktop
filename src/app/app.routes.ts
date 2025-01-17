import { Routes } from '@angular/router';
import { LoginComponent } from '@modules/core/login/login.component';

export const routes: Routes = [
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
    }
];
