module.exports = {
    types: [
        {
            value: ':sparkles: feat',
            name: '✨ feat:\tA new feature'
        },
        {
            value: ':bug: fix',
            name: '🐛 fix:\tA bug fix'
        },
        {
            value: ':package: build',
            name: '📦 build:\tNew build'
        },
        {
            value: ':truck: chore',
            name: '🚚 chore:\tGeneral changes'
        },
        {
            value: ':memo: docs',
            name: '📝 docs:\tDocumentation only changes'
        },
        {
            value: ':wrench: config',
            name: '🔧 config:\tAdd or update configuration files'
        },
        {
            value: ':zap: perf',
            name: '🚀 perf:\tA code change that improves performance'
        },
        {
            value: ':recycle: refactor',
            name: '♻️  refactor:\t A code change that neither fixes a bug nor adds a feature'
        },
        {
            value: ':art: style',
            name: '🎨 style:\tChanges that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)'
        },
        {
            value: ':mag: test',
            name: '🔍 test:\tAdding missing tests or correcting existing tests'
        }
    ],
    scopes: [],
    scopeOverrides: {
        fix: [{ name: 'merge' }, { name: 'style' }, { name: 'test' }, { name: 'hotfix' }]
    },

    allowCustomScopes: true,
    allowBreakingChanges: ['feat', 'fix'],
    skipQuestions: ['footer', 'breaking'],
    subjectLimit: 100,
    upperCaseSubject: true
};
