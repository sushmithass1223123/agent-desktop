const { addTailwindPlugin } = require("@ngneat/tailwind");
const tailwindConfig = require("./tailwind.config.js");
const webpack = require('webpack');

module.exports = (config) => {
    config.plugins.push(new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/));
    addTailwindPlugin({
        webpackConfig: config,
        tailwindConfig,
        patchComponentsStyles: true
    });
    return config;
};
