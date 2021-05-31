// route reasons
export const OUTBOX_REASONS = ['CheckerQueue', 'CheckerPull'];
export const SENT_REASONS = ['AgentSentPull'];
export const DRAFT_REASONS = ['AgentDraftPull'];
export const INBOX_REASONS = ['MakerQueue', 'AgentPull', 'TransferToAgent', 'TransferToSkill'];

// entites
export const AVAILABLE_ENTITIES = [
    { key: 'PERSON', label: 'Names' },
    { key: 'ORG', label: 'Organizations' },
    { key: 'GPE', label: 'Locations' },
    { key: 'DATE', label: 'Dates' }
];

