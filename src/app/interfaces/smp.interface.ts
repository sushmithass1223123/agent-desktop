export interface SmpComponentInputs {
    PostAccountName: string;
    ConversationID: string;
    SessionId: string;
    OutSessionId: string;
    PostId: string;
    SubChannel: string;
    SmActiveComment: SmComment;
    Subject: string;
    PostText: SmPostText;
    PostAttachments: SmPostAttachments[];
}

export interface SmComment {
    CommentId: string;
    ParentId: string;
    CommentText: SmCommentText;
    FromName: string;
}

export interface SmCommentText {
    InsertionDateTime: string;
    Text: string;
    CommentAttachments: SmCommentAttachment[];
}

export interface SmPostText {
    Text: string;
    CommentAttachments: SmCommentAttachment[];
}

export interface SmCommentAttachment {
    MediaUrl: string;
    MediaType: string;
    InsertionDateTime: string;
}

export interface SmPostAttachments {
    MediaUrl: string;
    MediaType: string;
    InsertionDateTime: string;
}