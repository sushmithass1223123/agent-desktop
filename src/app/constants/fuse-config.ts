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
    webFont: 'wf-roboto',
    flatTheme: false,
    customScrollbars: true,
    layout: {
        style: 'vertical-layout',
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
            customBackgroundColor: false,
            background: 'grey-200',
            hidden: false,
            position: 'below-fixed'
        },
        content: {
            customBackgroundColor: false,
            background: 'grey-200'
        },
        anchorWidget: {
            customBackgroundColor: false,
            bodyBackground: 'purple-A100',
            headerBackground: 'grey-100',
            contentBackground: 'grey-100'
        },
        widget: {
            customBackgroundColor: false,
            bodyBackground: 'grey-A100',
            headerBackground: 'grey-100',
            contentBackground: 'grey-100'
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
