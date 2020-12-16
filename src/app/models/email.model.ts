import { SafeHtml } from '@angular/platform-browser';

export interface CreateEmailInfo {
    To: string[];
    CC: string[];
    BCC: string[];
    Body: SafeHtml;
    Subject: string;
    Files: { Id?: string, SessionID?: string; Direction: 'IN' | 'OUT'; Name: string; URL: string }[];
}
