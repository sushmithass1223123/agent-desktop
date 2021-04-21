// route reasons
export const OUTBOX_REASONS = ['CheckerQueue', 'CheckerPull'];
export const DRAFT_REASONS = ['AgentDraftPull'];
export const INBOX_REASONS = ['MakerQueue', 'AgentPull', 'TransferToAgent'];

// entites
export const AVAILABLE_ENTITIES = [
    { key: 'PERSON', label: 'Names' },
    { key: 'ORG', label: 'Organizations' },
    { key: 'GPE', label: 'Locations' },
    { key: 'DATE', label: 'Dates' }
];


export const QUILL_EDITOR_CONFIG = {
    placeholder: 'Write your email ...',
    theme: 'snow',
    modules: {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'], // toggled buttons
            ['blockquote', 'code-block'],

            [{ header: 1 }, { header: 2 }], // custom button values
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ script: 'sub' }, { script: 'super' }], // superscript/subscript
            [{ indent: '-1' }, { indent: '+1' }], // outdent/indent
            [{ direction: 'rtl' }], // text direction

            // [{ size: ['small', false, 'large', 'huge'] }], // custom dropdown
            [{ header: [1, 2, 3, 4, 5, 6, false] }],

            [{ color: [] }, { background: [] }], // dropdown with defaults from theme
            // [{ 'font': [] }],
            [{ align: [] }],

            ['clean'], // remove formatting button

            ['link'] // , 'image', 'video'
        ]
    }
};
