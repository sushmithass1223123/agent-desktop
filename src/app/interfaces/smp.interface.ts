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

export interface AdvanceSearchResponse {
    Message: any
    StatusCode: string
    Status: string
    Result: Result[]
  }
  
  export interface Result {
    SessionID: string
    InSessionID: any
    From: string
    ToList: any
    CcList: any
    BccList: any
    Subject: string
    Body: string
    IsHtml: boolean
    SendDate: any
    SendTime: any
    SendStatus: any
    CreatedDate: any
    CreatedTime: any
    CreatedBy: any
    ConversationID: any
    CurrentStatus: string
    CurrentStatusDate: string
    CurrentStatusTime: string
    CurrentServicePoint: any
    Mailbox: string
    Label: string
    HasAttachments: boolean
    CmSkill: any
    AgentName: any
    Attachments: any
    RouteId: any
    MailAccountId: any
    SmmModel: any
    SocialMediaData: SocialMediaData
  }
  
  export interface SocialMediaData {
    Channel: any
    CommentInSessionId: any
    CommentOutSessionId: any
    Account: string
    Posts: Posts
    Comments: Comments
    ParentComments: ParentComments
    Engagement: Engagement
  }
  
  export interface Posts {
    SessionId: any
    Channel: any
    MainId: any
    PostId: string
    AccountId: any
    AccountName: any
    InsertionDateTime: string
    CreatedDateTime: string
    ReceivedDateTime: string
    UpdatedDateTime: string
    IsDeleted: number
    DeletedDateTime: string
    PostText: PostText
    CommentsList: any[]
    PostAttachments: any[]
    PostEngagements: any[]
  }
  
  export interface PostText {
    SessionId: any
    TextId: any
    Text: string
    InsertionDateTime: string
    UpdatedDateTime: string
    PreviousComment: any
  }
  
  export interface Comments {
    SessionId: string
    MainId: any
    PostId: any
    CommentId: string
    ParentId: any
    FromId: string
    FromName: any
    ToId: string
    ToName: any
    Direction: any
    MakerSkill: any
    CheckerSkill: any
    InsertionDateTime: string
    CreatedDateTime: string
    ReceivedDateTime: string
    UpdatedDateTime: string
    IsDeleted: number
    IsEdited: number
    DeletedDateTime: string
    CommentText: CommentText
    ReplyComments: any[]
    CommentAttachments: any[]
    CommentEngagements: any[]
  }
  
  export interface CommentText {
    SessionId: any
    TextId: any
    Text: string
    InsertionDateTime: string
    UpdatedDateTime: string
    PreviousComment: any
  }
  
  export interface ParentComments {
    SessionId: any
    MainId: any
    PostId: any
    CommentId: any
    ParentId: any
    FromId: any
    FromName: string
    ToId: any
    ToName: any
    Direction: any
    MakerSkill: any
    CheckerSkill: any
    InsertionDateTime: string
    CreatedDateTime: string
    ReceivedDateTime: string
    UpdatedDateTime: string
    IsDeleted: number
    IsEdited: number
    DeletedDateTime: string
    CommentText: any
    ReplyComments: any[]
    CommentAttachments: any[]
    CommentEngagements: any[]
  }
  
  export interface Engagement {
    Channel: any
    SmmType: any
    SmmId: any
    ReactionType: any
  }
  
