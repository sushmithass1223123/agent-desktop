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
    CC: string;
    BCC: string;
    Body: string;
    Subject: string;
    Files: EmailFile[];
}

export interface CreateEmailOutput {
    To: string[];
    CC: string[];
    BCC: string[];
    Body: string;
    Subject: string;
    Files: EmailFile[];
}
