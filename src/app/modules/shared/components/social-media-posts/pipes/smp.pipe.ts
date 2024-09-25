import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'SMPPipe' })
export class SMPPipe implements PipeTransform {
    /**
     * Method to transform input value
     * @param type Type of transformation to carry out
     * @param value Actual value in context
     * @param args Additional args to support transformation
     * @returns any
     */
    transform(type: string, value: any, args: any[]): any {
        switch (type) {
            case 'activeCommentValidator': {
                const currentTab = args[0];
                const selectedPostId = args[1];
                const selectedPostSessionId = args[2];
                const selectedPostOutSessionId = args[3];
                const post = value;

                if (currentTab === 'posts') {
                    return post.PostData.PostId === selectedPostId;
                }
                return (
                    (currentTab !== 'sentitem' &&
                        currentTab !== 'draft' &&
                        selectedPostSessionId === post.PostData.SessionId) ||
                    ((currentTab === 'sentitem' || currentTab === 'draft') &&
                        selectedPostOutSessionId === post.PostData.OutSessionId)
                );
            }
            case 'getActiveCommentStyle': {
                const hidePostActions = args[0];
                if (hidePostActions) return ' theme-bg delete-border twd-border-opacity-100';
                switch (value) {
                    case 'smc_e':
                    case 'smp_e':
                    case 'smco_e':
                        return ' theme-bg edit-item twd-border-opacity-100';
                    case 'smc_d':
                    case 'smco_d':
                    case 'smp_d':
                        return ' theme-bg delete-item twd-border-opacity-100';
                    case 'smrc_a':
                    default:
                        return ' active normal twd-border-primary-default twd-border-opacity-100';
                }
            }
            case 'stylizeContent': {
                try {
                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                    const hashtagRegex = /#(\w+)/g;
                    const mentionRegex = /@(\w+)/g;

                    if (!value) return;

                    value = value.replace(urlRegex, function (url) {
                        return '<a class="e_link" href="' + url + '" target="_blank">' + url + '</a>';
                    });

                    value = value.replace(hashtagRegex, function (match, p1) {
                        return '<span class="hashtag">#' + p1 + '</span>';
                    });

                    value = value.replace(mentionRegex, function (match, p1) {
                        return '<span class="mention">@' + p1 + '</span>';
                    });

                    if (args && args[0]) value += '...';

                    return value;
                } catch (e) {
                    console.error(e);
                    return value;
                }
            }
            case 'getTotalReactionCount': {
                if (!value) return 0;
                return value.reduce((total, reaction) => total + reaction.ReactionCount, 0);
            }
            case 'getCommentCount': {
                if (!args[0]) {
                    if (args[1].SmActiveComment && args[1].SmParentComments) return 2;
                    else return 1;
                } else {
                    return value?.filter((commentData) => commentData?.nestLevel === 0)?.length ?? 0;
                }
            }
            case 'getFileType': {
                const fileExtension = value.split('.').pop().toLowerCase();
                const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'gif'];
                const imageExtensions = ['png', 'jpg', 'jpeg', 'bmp'];

                if (videoExtensions.includes(fileExtension)) {
                    return 'video';
                }

                if (imageExtensions.includes(fileExtension)) {
                    return 'image';
                }

                return args[0]?.split('/')?.[0] ?? 'image';
            }
            case 'findPreviousCommentIndex': {
                return value?.find((commentData) => commentData?.CommentId === args[0].SmActiveComment.CommentId);
            }
            case 'validateLoadHistory': {
                return args[0].some(
                    (commentData: any) => commentData.ParentId === value.CommentId && commentData.isVisible
                );
            }
        }
    }
}
