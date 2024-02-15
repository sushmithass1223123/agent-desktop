type EmailFileSources = 'mediastreamer' | 'tmacproxy';
type EmailFileDirection = 'IN' | 'OUT';
export interface EmailFile {
    Id: string;
    SessionID?: string;
    Direction: EmailFileDirection;
    Name: string;
    URL: string;
    Ext: string;
    Source?: EmailFileSources;
    Icon: string;
    IsUploaded?: boolean;
}

export interface CreateEmailInput {
    To: string;
    From?: string;
    CC: string;
    BCC: string;
    Body: string;
    Subject: string;
    Files: EmailFile[];
    Replying?: true;
}

export interface CreateEmailOutput {
    To: string[];
    CC: string[];
    BCC: string[];
    Body: string;
    Subject: string;
    Files: EmailFile[];
}

export interface EmailComponentInputs {
    From: string;
    mailbox: string;
    prelude?: string;
    CreatedTime: string;
    SessionID: string;
    To: string[];
    CC: string[];
    BCC: string[];
    Body: string;
    Subject: string;
    Files: EmailFile[];
}

export type EmailComponentMode = 'preview' | 'compose' | 'reply' | 'reply-all' | 'forward' | 'draft' | 'quick-reply';
