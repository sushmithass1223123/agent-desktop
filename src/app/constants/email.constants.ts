// route reasons
export const OUTBOX_REASONS = ['CheckerQueue', 'CheckerPull'];
export const DRAFT_REASONS = ['AgentDraftPull'];
export const INBOX_REASONS = ['MakerQueue', 'AgentPull'];

// entites
export const AVAILABLE_ENTITIES = [
    { key: 'PERSON', label: 'People' },
    { key: 'ORG', label: 'Organizations' },
    { key: 'GPE', label: 'Locations' },
    { key: 'DATE', label: 'Dates' }
];
