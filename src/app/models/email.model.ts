import { SafeHtml } from '@angular/platform-browser';

export interface EmailFile {
    Id?: string;
    SessionID?: string;
    Direction: 'IN' | 'OUT';
    Name: string;
    URL: string;
}

export interface CreateEmailInput {
    To: string;
    CC: string;
    BCC: string;
    Body: SafeHtml;
    Subject: string;
    Files: EmailFile[];
}

export interface CreateEmailOutput {
    To: string[];
    CC: string[];
    BCC: string[];
    Body: SafeHtml;
    Subject: string;
    Files: EmailFile[];
}
