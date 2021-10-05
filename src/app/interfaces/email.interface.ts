import { SafeHtml } from '@angular/platform-browser';

export interface EmailFile {
    Id?: string;
    SessionID?: string;
    Direction: 'IN' | 'OUT';
    Name: string;
    URL: string;
    Ext: string;
    Icon: string;
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

export interface EmailComponentInputs extends CreateEmailOutput {
    From: string;
    mailbox: string;
    CreatedTime: string;
}

export type EmailComponentMode = 'preview' | 'compose' | 'reply' | 'reply-all' | 'forward' | 'draft';
