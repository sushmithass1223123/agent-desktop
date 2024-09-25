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
    PostCreatedTime: string;
    PostUpdatedTime: string
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
    IsParentCommentEdited: boolean;
    IsParentCommentDeleted: boolean;
    IsCommentDeleted: boolean;
    IsCommentEdited: boolean;
    IsPostDeleted: boolean;
    PostAttachments: SmPostAttachments[];
    PostEngagements: PostEngagement[];
    Engagement: Engagement;
}
export interface Engagement {
    Channel: any;
    SmmType: any;
    smmId: any;
    ReactionType: any;
}

export interface PostEngagement {
    ReactionType: string;
    ReactionCount: number;
}

export interface SmComment {
    CommentId: string;
    ParentId: string;
    CommentText: SmCommentText;
    FromName: string;
    CommentAttachments: SmCommentAttachment[];
    CommentEngagements: Engagement[];
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
