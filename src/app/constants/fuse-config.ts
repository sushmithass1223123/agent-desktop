import { FuseConfig } from '@fuse/types';

/**
 * Default Fuse Configuration
 *
 * You can edit these options to change the default options. All these options also can be
 * changed per component basis. See `app/main/pages/authentication/login/login.component.ts`
 * constructor method to learn more about changing these options per component basis.
 */

export const fuseConfig: FuseConfig = {
    // Color themes can be defined in src/app/app.theme.scss
    colorTheme: 'theme-default',
    customScrollbars: true,
    layout: {
        style: 'vertical-layout-1',
        width: 'fullwidth',
        navbar: {
            customBackgroundColor: false,
            background: 'purple-700',
            folded: true,
            hidden: false,
            position: 'left',
            variant: ''
        },
        toolbar: {
            customBackgroundColor: true,
            background: 'grey-300',
            hidden: false,
            position: 'below-fixed'
        },
        content: {
            customBackgroundColor: true,
            background: 'grey-300'
        },
        widget: {
            customBackgroundColor: false,
            headerBackground: 'purple-700',
            anchorBodyBackground: 'grey-700',
            bodyBackground: 'grey-400',
        },
        footer: {
            customBackgroundColor: false,
            background: 'grey-400',
            hidden: true,
            position: 'below-fixed'
        },
        sidepanel: {
            hidden: false,
            position: 'right'
        }
    }
};
