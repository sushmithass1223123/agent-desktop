export interface CreateEmailInfo {
    To: string[];
    CC: string[];
    BCC: string[];
    Body: string;
    Subject: string;
    Files: { Id: string; Name: string; Url: string }[];
}
