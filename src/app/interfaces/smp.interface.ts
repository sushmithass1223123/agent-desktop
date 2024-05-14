type PostFileSources = 'mediastreamer' | 'tmacproxy';
type PostFileDirection = 'IN' | 'OUT';
export interface PostFile {
    Id: string;
    SessionID?: string;
    Direction: PostFileDirection;
    Name: string;
    URL: string;
    Ext: string;
    Source?: PostFileSources;
    Icon: string;
    IsUploaded?: boolean;
}

export interface SmpComponentInputs {
    Files: any[];
    PostAccountName: string;
    ConversationID: string;
    SessionId: string;
    OutSessionId: string;
    PostId: string;
    SubChannel: string;
    SmActiveComment: SmComment;
    SmParentComments: SmComment;
    Subject: string;
    PostText: SmPostText;
    IsOutbound: boolean;
    PostAttachments: SmPostAttachments[];
}

export interface SmComment {
    CommentId: string;
    ParentId: string;
    CommentText: SmCommentText;
    FromName: string;
    CommentAttachments: SmCommentAttachment[];
}

export interface SmCommentText {
    InsertionDateTime: string;
    Text: string;
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
