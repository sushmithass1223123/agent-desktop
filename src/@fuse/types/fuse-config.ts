export interface FuseConfig {
    colorTheme: string;
    customScrollbars: boolean;
    layout: {
        style: string,
        width: 'fullwidth' | 'boxed',
        navbar: {
            customBackgroundColor: boolean,
            background: string,
            hidden: boolean,
            folded: boolean,
            position: 'left' | 'right' | 'top',
            variant: string
        },
        toolbar: {
            customBackgroundColor: boolean,
            background: string,
            hidden: boolean,
            position: 'above' | 'above-static' | 'above-fixed' | 'below' | 'below-static' | 'below-fixed'
        },
        content: {
            customBackgroundColor: boolean,
            background: string
        },
        widget: {
            customBackgroundColor: boolean,
            headerBackground: string,
            anchorBodyBackground: string,
            bodyBackground: string,
        },
        footer: {
            customBackgroundColor: boolean,
            background: string,
            hidden: boolean,
            position: 'above' | 'above-static' | 'above-fixed' | 'below' | 'below-static' | 'below-fixed'
        },
        sidepanel: {
            hidden: boolean,
            position: 'left' | 'right'
        }
    };
}
