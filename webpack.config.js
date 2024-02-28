// const { addTailwindPlugin } = require("@ngneat/tailwind");
// const tailwindConfig = require("./tailwind.config.js");
const webpack = require('webpack');

module.exports = (config) => {
    config.plugins.push(new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
    }));
    config.resolve.fallback = {
        "url": false,
        "http": false,
        "util": false,
        "https": false
    }
    // addTailwindPlugin({
    //     webpackConfig: config,
    //     tailwindConfig,
    //     patchComponentsStyles: true
    // });
    return config;
};
