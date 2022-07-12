const standardVersion = require('standard-version');

// standard-version-updater.js
const stringifyPackage = require('stringify-package');
const detectIndent = require('detect-indent');
const detectNewline = require('detect-newline');

readVersion = function (contents) {
    return JSON.parse(contents).version;
};

writeVersion = function (contents, version) {
    const json = JSON.parse(contents);
    let indent = detectIndent(contents).indent;
    let newline = detectNewline(contents);
    json.version = '1.1.1';
    return stringifyPackage(json, indent, newline);
};

// .versionrc.js
const tracker = {
    filename: './package.json',
    type: 'json',
    updater: { readVersion, writeVersion }
};

module.exports = {
    bumpFiles: [tracker],
    packageFiles: [tracker]
};

// Options are the same as command line, except camelCase
// standardVersion returns a Promise
standardVersion({
    types: [
        { type: 'feat', section: 'Features' },
        { type: 'fix', section: 'Bug Fixes' },
        { type: 'build', section: 'New Build' },
        { type: 'chore', section: 'General Changes' },
        { type: 'docs', section: 'Documentation' },
        { type: 'config', section: 'Config Changes' },
        { type: 'perf', section: 'Performance Improvement' },
        { type: 'refactor', section: 'Code Refactor' },
        { type: 'style', section: 'Code Style Changes' },
        { type: 'test', section: 'Test' },
    ],
    bumpFiles: [tracker],
    packageFiles: [tracker]
})
    .then(() => {
        // standard-version is done
    })
    .catch((err) => {
        console.error(`standard-version failed with message: ${err.message}`);
    });
