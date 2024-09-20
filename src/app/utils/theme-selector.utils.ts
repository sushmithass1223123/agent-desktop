export const getFuseConfigByTheme = (themeName: string, selector: boolean) => {
    let selectedTheme = null;
    switch (themeName) {
        case 'theme-default-2': {
            selectedTheme = {
                layout: {
                    navbar: {
                        customBackgroundColor: true,
                        background: 'purple-700'
                    },
                    toolbar: {
                        customBackgroundColor: true,
                        background: 'grey-200'
                    },
                    content: {
                        customBackgroundColor: true,
                        background: 'grey-200'
                    },
                    anchorWidget: {
                        customBackgroundColor: true,
                        bodyBackground: 'purple-A100',
                        headerBackground: 'grey-100',
                        contentBackground: 'grey-100'
                    },
                    widget: {
                        customBackgroundColor: true,
                        bodyBackground: 'grey-A100',
                        headerBackground: 'grey-100',
                        contentBackground: 'grey-100'
                    },
                    footer: {
                        customBackgroundColor: true,
                        background: 'grey-400'
                    }
                }
            };
            break;
        }
        case 'theme-default-3': {
            selectedTheme = {
                layout: {
                    navbar: {
                        customBackgroundColor: true,
                        background: 'purple-700'
                    },
                    toolbar: {
                        customBackgroundColor: true,
                        background: 'purple-50'
                    },
                    content: {
                        customBackgroundColor: true,
                        background: 'purple-50'
                    },
                    anchorWidget: {
                        customBackgroundColor: true,
                        bodyBackground: 'red-200',
                        headerBackground: 'purple-700',
                        contentBackground: 'red-50'
                    },
                    widget: {
                        customBackgroundColor: true,
                        bodyBackground: 'grey-A100',
                        headerBackground: 'purple-700',
                        contentBackground: 'purple-50'
                    },
                    footer: {
                        customBackgroundColor: true,
                        background: 'grey-400'
                    }
                }
            };
            break;
        }
        case 'theme-teal-red': {
            selectedTheme = {
                layout: {
                    navbar: {
                        customBackgroundColor: true,
                        background: 'teal-800'
                    },
                    toolbar: {
                        customBackgroundColor: true,
                        background: 'grey-50'
                    },
                    content: {
                        customBackgroundColor: true,
                        background: 'grey-50'
                    },
                    anchorWidget: {
                        customBackgroundColor: true,
                        bodyBackground: 'red-200',
                        headerBackground: 'teal-900',
                        contentBackground: 'red-50'
                    },
                    widget: {
                        customBackgroundColor: true,
                        bodyBackground: 'teal-100',
                        headerBackground: 'teal-800',
                        contentBackground: 'grey-50'
                    },
                    footer: {
                        customBackgroundColor: true,
                        background: 'grey-400'
                    }
                }
            };
            break;
        }
        case 'theme-cyan-orange': {
            selectedTheme = {
                layout: {
                    navbar: {
                        customBackgroundColor: true,
                        background: 'cyan-500'
                    },
                    toolbar: {
                        customBackgroundColor: true,
                        background: 'grey-50'
                    },
                    content: {
                        customBackgroundColor: true,
                        background: 'grey-50'
                    },
                    anchorWidget: {
                        customBackgroundColor: true,
                        bodyBackground: 'orange-400',
                        headerBackground: 'cyan-600',
                        contentBackground: 'orange-50'
                    },
                    widget: {
                        customBackgroundColor: true,
                        bodyBackground: 'cyan-100',
                        headerBackground: 'cyan-500',
                        contentBackground: 'grey-100'
                    },
                    footer: {
                        customBackgroundColor: false,
                        background: 'grey-400'
                    }
                }
            };
            break;
        }
        case 'theme-indigo-deeporange': {
            selectedTheme = {
                layout: {
                    navbar: {
                        customBackgroundColor: true,
                        background: 'indigo-800'
                    },
                    toolbar: {
                        customBackgroundColor: true,
                        background: 'grey-200'
                    },
                    content: {
                        customBackgroundColor: true,
                        background: 'grey-200'
                    },
                    anchorWidget: {
                        customBackgroundColor: true,
                        bodyBackground: 'deep-orange-300',
                        headerBackground: 'indigo-800',
                        contentBackground: 'deep-orange-100'
                    },
                    widget: {
                        customBackgroundColor: true,
                        bodyBackground: 'indigo-200',
                        headerBackground: 'indigo-600',
                        contentBackground: 'indigo-50'
                    },
                    footer: {
                        customBackgroundColor: false,
                        background: 'grey-400'
                    }
                }
            };
            break;
        }
        case 'theme-default-dark': {
            selectedTheme = {
                layout: {
                    navbar: {
                        customBackgroundColor: false,
                        background: 'grey-900'
                    },
                    toolbar: {
                        customBackgroundColor: true,
                        background: 'grey-900'
                    },
                    content: {
                        customBackgroundColor: true,
                        background: 'grey-900'
                    },
                    anchorWidget: {
                        customBackgroundColor: true,
                        bodyBackground: 'grey-800',
                        headerBackground: '',
                        contentBackground: ''
                    },
                    widget: {
                        customBackgroundColor: false,
                        bodyBackground: '',
                        headerBackground: '',
                        contentBackground: ''
                    },
                    footer: {
                        customBackgroundColor: false,
                        background: 'grey-400'
                    }
                }
            };
            break;
        }
        case 'theme-blue-grey-dark': {
            selectedTheme = {
                layout: {
                    navbar: {
                        customBackgroundColor: true,
                        background: 'blue-grey-900'
                    },
                    toolbar: {
                        customBackgroundColor: true,
                        background: 'grey-900'
                    },
                    content: {
                        customBackgroundColor: true,
                        background: 'grey-900'
                    },
                    anchorWidget: {
                        customBackgroundColor: true,
                        bodyBackground: 'blue-grey-700',
                        headerBackground: 'blue-grey-900',
                        contentBackground: 'blue-grey-800'
                    },
                    widget: {
                        customBackgroundColor: true,
                        bodyBackground: 'blue-grey-700',
                        headerBackground: '',
                        contentBackground: ''
                    },
                    footer: {
                        customBackgroundColor: false,
                        background: 'grey-400'
                    }
                }
            };
            break;
        }
        case 'theme-pink-grey-dark': {
            selectedTheme = {
                layout: {
                    navbar: {
                        customBackgroundColor: true,
                        background: 'pink-800'
                    },
                    toolbar: {
                        customBackgroundColor: true,
                        background: 'grey-900'
                    },
                    content: {
                        customBackgroundColor: true,
                        background: 'grey-900'
                    },
                    anchorWidget: {
                        customBackgroundColor: true,
                        bodyBackground: 'pink-800',
                        headerBackground: '',
                        contentBackground: 'grey-800'
                    },
                    widget: {
                        customBackgroundColor: true,
                        bodyBackground: '',
                        headerBackground: 'pink-800',
                        contentBackground: ''
                    },
                    footer: {
                        customBackgroundColor: false,
                        background: 'grey-400'
                    }
                }
            };
            break;
        }
        default: {
            selectedTheme = {
                layout: {
                    navbar: {
                        customBackgroundColor: true,
                        background: 'grey-50'
                    },
                    toolbar: {
                        customBackgroundColor: true,
                        background: 'grey-200'
                    },
                    content: {
                        customBackgroundColor: true,
                        background: 'grey-200'
                    },
                    anchorWidget: {
                        customBackgroundColor: true,
                        bodyBackground: 'grey-300',
                        headerBackground: 'grey-100',
                        contentBackground: 'grey-100'
                    },
                    widget: {
                        customBackgroundColor: true,
                        bodyBackground: 'grey-A100',
                        headerBackground: 'grey-100',
                        contentBackground: 'grey-100'
                    },
                    footer: {
                        customBackgroundColor: false,
                        background: 'grey-400'
                    }
                }
            };
            break;
        }
    }

    // if the request is to set theme from app config append the theme name
    if (!selector) {
        selectedTheme.colorTheme = themeName;
    }

    // return the selected theme
    return selectedTheme;
};
