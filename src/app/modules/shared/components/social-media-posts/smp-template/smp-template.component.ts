import { filter, first } from 'rxjs/operators';
import { ChangeDetectorRef, Component, Input, ViewEncapsulation } from '@angular/core';
import { FuseFacadeService } from '@services/fuse-facade.service';

interface Comment {
    cid: number;
    active?: boolean;
    comment: string;
    commenter: string;
    replies: Comment[];
    parents?: number[];
    hidden?: boolean;
}

@Component({
    selector: 'smp-template',
    templateUrl: './smp-template.component.html',
    styleUrls: ['./smp-template.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class SmpTemplateComponent {
    @Input() hideStructureActions: boolean = false;
    commentMode: string = 'initial';
    /**
     * Fuse custom config
     */
    customFuse = {
        anchor$: this._fuseFacadeService.anchorBgClasses$.pipe(filter(() => true)),
        widget$: this._fuseFacadeService.widgetBgClasses$
    };
    /**
     * Commments array
     */
    comments: Comment[] = [
        {
            cid: 3,
            commenter: 'Linda',
            comment: 'Jake vs Mike!',
            replies: []
        },
        {
            cid: 4,
            commenter: 'Arthur Shelby',
            comment: 'Who is going to win!',
            replies: [
                {
                    cid: 41,
                    commenter: 'Tommy Shelby',
                    comment: 'Brother you here!!',
                    replies: []
                },
                {
                    cid: 42,
                    commenter: 'John Shelby',
                    comment: 'OKOKOKOKOKOKOKOKOKOKOKOKOKOKOK',
                    replies: [
                        {
                            cid: 421,
                            commenter: 'Aunt Polly',
                            comment: 'Shut up!',
                            replies: []
                        }
                    ]
                }
            ]
        },
        {
            cid: 1,
            commenter: 'Janet Archer',
            comment: 'Jake paul gon win!',
            replies: [
                {
                    cid: 11,
                    commenter: 'Yashwanthkumar Arivazhagan',
                    comment: 'No way bruh..',
                    replies: [
                        {
                            cid: 111,
                            commenter: 'Akash S',
                            comment:
                                "True. Mike's gonna whoop him outta the octagon. Mark my words.",
                            replies: []
                        },
                        {
                            cid: 112,
                            commenter: 'Michael Carl',
                            comment: 'Yes. He is mad.',
                            active: true,
                            replies: []
                        }
                    ]
                },
                {
                    cid: 12,
                    commenter: 'Jake Paul',
                    comment: 'I am gonna win!',
                    replies: []
                }
            ]
        },
        {
            cid: 2,
            commenter: 'Alan Wake',
            comment: 'Why they telecasting in NF tho?',
            replies: []
        }
    ];

    orgCommentArray: Comment[] = [];
    commentsToBeRendered: Comment[] = [];
    prevComments: Comment[][] = [];
    nextComments: Comment[][] = [];

    commentStructureModifyer = {
        previousRepliesLoaded: false,
        nextRepliesLoaded: false,
        prevCommentLoadLevel: 0,
        nextCommentLoadLevel: 0
    };

    constructor(private _fuseFacadeService: FuseFacadeService, private cdr: ChangeDetectorRef) {
        this.orgCommentArray = JSON.parse(JSON.stringify(this.comments));
        this.comments = this.flattenNestedComments(this.comments);
        this.setRenderedComments();
    }

    /**
     * Recursive method to flatten each comment
     * @param comments Actual comment array to be nested
     * @param parents Recursive argument
     */
    flattenNestedComments(comments: Comment[], parents: any[] = []): Comment[] {
        try {
            let flattenedComments = [];

            comments.forEach((comment) => {
                const { cid, commenter, active, comment: text, replies } = comment;
                const newComment: any = { cid, commenter, active, comment: text };

                if (parents.length > 0) {
                    newComment.parents = [...parents];
                }

                flattenedComments.push(newComment);

                if (replies.length > 0) {
                    const newParents = [...parents, cid];
                    flattenedComments = flattenedComments.concat(
                        this.flattenNestedComments(replies, newParents)
                    );
                }
            });

            return flattenedComments;
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Method to dynamically calculate the length of the comment branch
     * @param commentId Comment id of the comment
     * @returns Length of the branch
     */
    getVertbranchLength(commentArray: Comment[], commentId: number): number {
        const repliesForCid = commentArray.filter((comment: Comment) =>
            comment?.parents?.includes(commentId)
        );
        let height = 0;

        repliesForCid.forEach((comment: Comment, i: number) => {
            if (document.getElementById(comment.cid.toString())) {
                height += document.getElementById(comment.cid.toString()).clientHeight + (this.hideStructureActions ? -5 : 20);
                if (
                    i == repliesForCid.length - 1 &&
                    this.commentMode !== 'initial' &&
                    this.commentStructureModifyer.previousRepliesLoaded
                ) {
                    height -= document.getElementById(comment.cid.toString()).clientHeight / 2 - 9;
                }
            }

            if(comment.active) {
                height+=190;
            }
        });

        if (height && document.querySelector('.cu-lp')) {
            height += document.querySelector('.cu-lp').clientHeight - 5;
        }

        return height;
    }

    /**
     * Method to modify actual comments array to be rendered in the UI
     */
    setRenderedComments(): void {
        try {
            this.commentsToBeRendered = [];

            const activeCommentIndex: number = this.comments.findIndex(
                (comment: Comment) => comment.active === true
            );
            const activeCommentRootParent: number = this.comments[activeCommentIndex]?.parents
                ?.length
                ? this.comments[activeCommentIndex]?.parents[0]
                : this.comments[activeCommentIndex].cid;

            this.comments.forEach((comment: Comment, i: number) => {
                if (
                    comment.cid === activeCommentRootParent ||
                    (comment?.parents?.includes(activeCommentRootParent) &&
                        i < activeCommentIndex &&
                        this.commentStructureModifyer.previousRepliesLoaded)
                ) {
                    this.commentsToBeRendered.push(comment);
                }
                if (comment?.active && comment.cid !== activeCommentRootParent)
                    this.commentsToBeRendered.push(comment);
                if (
                    comment?.parents?.includes(activeCommentRootParent) &&
                    i > activeCommentIndex &&
                    this.commentStructureModifyer.nextRepliesLoaded
                ) {
                    this.commentsToBeRendered.push(comment);
                }
            });

            if (
                this.commentStructureModifyer.previousRepliesLoaded ||
                this.commentStructureModifyer.nextRepliesLoaded
            ) {
                this.commentMode = 'modified';
            }
            this.cdr.detectChanges();
        } catch (error) {
            console.error(error);
        }
    }

    checkCommentStructure(structure: string, commentParents: number[]): boolean {
        try {
            const activeCommentIndex: number = this.comments.findIndex(
                (comment: Comment) => comment.active === true
            );
            const activeCommentRootParent: number = this.comments[activeCommentIndex]?.parents[0];
            if (structure === 'prevrep') {
                const previousRepliesExists =
                    activeCommentRootParent &&
                    JSON.parse(JSON.stringify(this.comments)).splice(
                        this.comments.findIndex(
                            (comment: Comment) => comment.cid === activeCommentRootParent
                        ),
                        activeCommentIndex
                    ).length > 1;
                return previousRepliesExists;
            } else if (structure === 'nextrep') {
                const nextRepliesExists = JSON.parse(JSON.stringify(this.comments))
                    .splice(activeCommentIndex + 1)
                    .some((comment: Comment) => comment?.parents.includes(activeCommentRootParent));
                return nextRepliesExists;
            } else if (structure === 'prevcmt') {
                return (
                    this.orgCommentArray[
                        this.orgCommentArray.findIndex(
                            (comment: Comment) => comment.cid === activeCommentRootParent
                        ) -
                            this.commentStructureModifyer.prevCommentLoadLevel -
                            1
                    ] !== undefined
                );
            } else if (structure === 'nextcmt') {
                return (
                    this.orgCommentArray[
                        this.orgCommentArray.findIndex(
                            (comment: Comment) => comment.cid === activeCommentRootParent
                        ) +
                            this.commentStructureModifyer.nextCommentLoadLevel +
                            1
                    ] !== undefined
                );
            } else if (structure === 'prevcmtprevrep') {
                return this.prevComments[commentParents[0]].some(
                    (comment: Comment) => comment?.parents?.length && comment?.hidden
                );
            } else if (structure === 'nextcmtprevrep') {
                return this.nextComments[commentParents[0]].some(
                    (comment: Comment) => comment?.parents?.length && comment?.hidden
                );
            }
        } catch (error) {
            console.error(error);
        }
    }

    loadHistory(direction: string): void {
        try {
            const activeCommentIndex: number = this.comments.findIndex(
                (comment: Comment) => comment.active === true
            );
            const activeCommentRootParent: number = this.comments[activeCommentIndex]?.parents[0];
            if (direction === 'prev') {
                this.commentStructureModifyer.prevCommentLoadLevel++;
                const commentToFlatten = [
                    this.orgCommentArray[
                        this.orgCommentArray.findIndex(
                            (comment: Comment) => comment.cid === activeCommentRootParent
                        ) - this.commentStructureModifyer.prevCommentLoadLevel
                    ]
                ];
                let flattenedComments = this.flattenNestedComments(commentToFlatten);
                flattenedComments.forEach((c: Comment) => {
                    if (c?.parents?.length) c.hidden = true;
                });
                this.prevComments.unshift(flattenedComments);
            } else {
                this.commentStructureModifyer.nextCommentLoadLevel++;
                const commentToFlatten = [
                    this.orgCommentArray[
                        this.orgCommentArray.findIndex(
                            (comment: Comment) => comment.cid === activeCommentRootParent
                        ) + this.commentStructureModifyer.nextCommentLoadLevel
                    ]
                ];
                let flattenedComments = this.flattenNestedComments(commentToFlatten);
                flattenedComments.forEach((c: Comment) => {
                    if (c?.parents?.length) c.hidden = true;
                });
                this.nextComments.unshift(flattenedComments);
            }
        } catch (error) {
            console.error(error);
        }
    }

    loadHistoryCommentReplies(direction: string, index: number): void {
        try {
            if (direction === 'prev') {
                this.prevComments[index].forEach((comment: Comment) => {
                    comment.hidden = false;
                });
            } else {
                this.nextComments[index].forEach((comment: Comment) => {
                    comment.hidden = false;
                });
            }
            this.cdr.detectChanges();
        } catch (error) {
            console.error(error);
        }
    }

    getReplyCount(commentArray: Comment[]): number {
        try {
            let replyCount = 0;
            commentArray.forEach((comment: Comment) => {
                if (comment?.parents?.length) replyCount++;
            });
            return replyCount;
        } catch (error) {
            console.error(error);
        }
    }
}
