const generateColors = (color) => {
    return new Array(10)
        .fill(1)
        .map((_, i) => i)
        .reduce((acc, i) => {
            acc[`${i * 100 || 50}`] = `var(${color}-${i * 100 || 50})`;
            acc[`contrast-${i * 100 || 50}`] = `var(${color}-contrast-${i * 100 || 50})`;
            return acc;
        }, {});
};
module.exports = {
    prefix: 'twd-',
    purge: {
        content: ['./src/**/*.{html,ts}', './libs/**/*.{html,ts}']
    },
    darkMode: 'class', // or 'media' or 'class'
    theme: {
        extend: {
            colors: {
                primary: generateColors('--twd-primary'),
                accent: generateColors('--twd-accent'),
                warn: generateColors('--twd-warn'),
            },
            maxHeight: {
                0: '0',
                '1/4': '25%',
                '1/2': '50%',
                '3/4': '75%',
                full: '100%'
            }
        }
    },
    variants: {
        extend: {}
    },
    plugins: []
};
