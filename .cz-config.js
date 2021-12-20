module.exports = {
    types: [
        { value: '✨ feat', name: '✨ feat:\tAdding a new feature' },
        { value: '🔨 fix', name: '🔨 fix:\tFixing a bug' },
        { value: '🚚 chore', name: '🚚 chore:\tGeneral changes' },
        { value: '📝 docs', name: '📝 docs:\tAdd or update documentation' },
        {
            value: '🎨 style',
            name: '🎨 style:\tAdd or update styles, ui or ux'
        },
        {
            value: '♻️  refactor',
            name: '♻️  refactor:\tCode change that neither fixes a bug nor adds a feature'
        },
        {
            value: '🚀 perf',
            name: '🚀 perf:\tCode change that improves performance'
        },
        {
            value: '💉 test',
            name: '💉 test:\tAdding tests cases'
        },
        {
            value: '💻 build',
            name: '💻 build:\tNew build'
        }
    ],
    // { name: 'ui' }, { name: 'android' }, { name: 'ios' }, { name: 'home' }, { name: 'planner' }, { name: 'settings' }
    scopes: [],

    scopeOverrides: {
        fix: [{ name: 'merge' }, { name: 'style' }, { name: 'test' }, { name: 'hotfix' }]
    },

    allowCustomScopes: true,
    allowBreakingChanges: ['feat', 'fix'],
    // skip any questions you want
    skipQuestions: ['footer', 'breaking'],
    subjectLimit: 100,
    upperCaseSubject: true
};
