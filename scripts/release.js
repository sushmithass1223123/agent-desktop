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
        { type: 'docs', section: 'Documentation' },
        { type: 'style', section: 'Styling' },
        { type: 'refactor', section: 'Refactors' },
        { type: 'perf', section: 'Performance' },
        { type: 'test', section: 'Tests' },
        { type: 'build', section: 'Build System' },
        { type: 'ci', section: 'CI' },
        { type: 'chore', section: 'Chore' },
        { type: 'revert', section: 'Reverts' }
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
