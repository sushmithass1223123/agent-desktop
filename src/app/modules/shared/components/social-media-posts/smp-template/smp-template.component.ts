import { filter } from 'rxjs/operators';
import { Component, Input, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { FuseFacadeService } from '@services/fuse-facade.service';
import { PostAttachment, SocialMediaData } from '@tmac/sdk';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

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
export class SmpTemplateComponent implements OnInit {
    @Input() postData: any;

    socialMediaData: SocialMediaData;

    @Input() hideStructureActions: boolean = false;
    /**
     * Fuse custom config
     */
    customFuse = {
        anchor$: this._fuseFacadeService.anchorBgClasses$.pipe(filter(() => true)),
        widget$: this._fuseFacadeService.widgetBgClasses$,
        config$: this._fuseFacadeService.getConfig({ colorTheme: 'colorTheme' })
    };

    @Input() MaximumAllowedPostImageRendering: number = 5;

    lineClampCharacterCount: number = 100;

    /**
     * Preview media dialog
     */
    @ViewChild('previewMediaDialog')
    previewMediaDialog: TemplateRef<any>;
    /**
     * Preview media dialog ref
     */
    previewMediaDialogRef: MatDialogRef<any>;
    previewMediaDialogData: any;

    constructor(private _fuseFacadeService: FuseFacadeService, private _matDialog: MatDialog) {}

    ngOnInit(): void {
        this.socialMediaData = this.postData?.SocialMediaData;
        this.socialMediaData.Posts.PostText.Text = "She had been told time and time again that the most important steps were the first and the last. It was something that she carried within her in everything she did, but then he showed up and disrupted everything. He told her that she had it wrong. The first step wasn't the most important. The last step wasn't the most important. It was the next step that was the most important. She nervously peered over the edge. She understood in her mind that the view was supposed to be beautiful, but all she felt was fear. There had always been something about heights that disturbed her, and now she could feel the full force of this unease. She reluctantly crept a little closer with the encouragement of her friends as the fear continued to build. She couldn't help but feel that something horrible was about to happen."
        this.validateReadMore();
    }

    scrollToActiveComment(): void {
        try {
            const activeCommentEl = document.querySelectorAll('.active-comment');
            if (activeCommentEl?.length) {
                activeCommentEl.forEach((el) => {
                    el.scrollIntoView({ behavior: 'smooth' });
                });
            }
        } catch (error) {
            console.error(error);
        }
    }

    parseDotnetDate(dotnetDate: string): Date {
        try {
            const regex = /\/Date\((\d+)\)\//;
            const match = dotnetDate.match(regex);
            if (match && match.length > 1) {
                const timestamp = parseInt(match[1], 10);
                return new Date(timestamp);
            }
            return new Date();
        } catch (error) {
            console.error(error);
        }
    }

    getGenericTimeFormat(dotnetDate: string): string {
        try {
            if (!dotnetDate) return 'NA';
            const currentDate: any = new Date();
            const date: any = this.parseDotnetDate(dotnetDate);
            const diffMilliseconds = currentDate - date;

            const diffSeconds = Math.floor(diffMilliseconds / 1000);
            const diffMinutes = Math.floor(diffSeconds / 60);
            const diffHours = Math.floor(diffMinutes / 60);
            const diffDays = Math.floor(diffHours / 24);
            const diffWeeks = Math.floor(diffDays / 7);

            const currentMonth = currentDate.getMonth() + 1;
            const currentDateWithoutTime = new Date(currentDate.getFullYear(), currentMonth, 0);
            const dateWithoutTime = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            const diffMonths =
                (currentDateWithoutTime.getFullYear() - dateWithoutTime.getFullYear()) * 12 +
                (currentDateWithoutTime.getMonth() - dateWithoutTime.getMonth());

            if (diffSeconds < 60) {
                return `${diffSeconds}s`;
            } else if (diffMinutes < 60) {
                return `${diffMinutes}m`;
            } else if (diffHours < 24) {
                return `${diffHours}h`;
            } else if (diffDays < 7) {
                return `${diffDays}d`;
            } else if (diffMonths < 12) {
                return `${diffWeeks}w`;
            } else {
                return 'older';
            }
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * To preview the media in the post
     * @param {PostAttachment} previewData Post attachment data
     */
    public previewMedia(previewData: PostAttachment): void {
        let otherData = null;
        if (previewData.MediaType == 'Photo') {
            otherData = {
                scale: 1
            };
        }

        this.previewMediaDialogData = {
            timestamp: this.parseDotnetDate(previewData.InsertionDateTime),
            attachment: {
                type: previewData.MediaType,
                src: previewData.MediaUrl
            },
            otherData
        };

        this.previewMediaDialogRef = this._matDialog.open(this.previewMediaDialog, {
            panelClass: 'preview-media-dialog'
        });
        this.previewMediaDialogRef.afterOpened().subscribe(() => {
            if (previewData.MediaType == 'Video') {
                const scrollContainer = document.querySelector('.drag-scroll-content') as HTMLDivElement;
                if (scrollContainer) {
                    scrollContainer.style.overflow = 'auto';
                    scrollContainer.style.height = '';
                    scrollContainer.style.height = '100%';
                    scrollContainer.style.minHeight = '100px';
                    scrollContainer.style.maxHeight = '600px';
                    scrollContainer.style.width = '';
                    scrollContainer.style.maxWidth = '800px';
                    scrollContainer.style.display = 'flex';
                }
            }
        });
    }

    validateReadMore() {
        try {
            setTimeout(() => {
                const contentParaEl = document.getElementById('contentPara');
                const readMoreEl = document.getElementById('readMore');
                const maxHeight = 3 * parseFloat(window.getComputedStyle(contentParaEl).lineHeight);
    
                if (contentParaEl.clientHeight > maxHeight) {
                    contentParaEl.classList.add('clamp');
                    readMoreEl.style.display = 'block';
                } else {
                    readMoreEl.style.display = 'none';
                }
            }, 500);
        } catch (error) {
            console.error(error);
        }
    }

    onReadMore(event: any) {
        event.preventDefault();
        const contentParaEl = document.getElementById('contentPara');
        const readMoreEl = document.getElementById('readMore'); 

        contentParaEl.classList.toggle("clamp");
        readMoreEl.style.display = 'none';
    }
}
