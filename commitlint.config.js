const types = ['feat', 'fix', 'build', 'chore', 'docs', 'config', 'perf', 'refactor', 'style', 'test'];
module.exports = {
    extends: ['gitmoji'],
    rules: {
        'header-max-length': [0, 'always', 100],
        'scope-case': [0, 'always', 'pascal-case'],
        'type-enum': [2, 'always', types],
        'type-case': [2, 'always', 'lower-case'],
        'type-empty': [2, 'never']
    }
};
