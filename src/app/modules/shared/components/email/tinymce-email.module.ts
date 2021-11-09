import { APP_BASE_HREF, CommonModule } from '@angular/common';
import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Inject,
    Input,
    NgModule,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild
} from '@angular/core';
import { MaterialModule } from '@modules/shared/material.module';
import { TUtils } from '@tmac/sdk';
import { fromEvent, Subject } from 'rxjs';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import tinymce, { Editor } from 'tinymce';
import { IEmailEditor } from './email-editor.interface';

/**
 * Email editor component
 */
@Component({
    selector: 'email-editor',
    template: `
        <div #hostEl class="twd-w-full twd-h-full twd-relative">
            <div *ngIf="loading" class="twd-z-10 twd-absolute twd-w-full mat-title twd-h-full twd-bg-white/40 twd-grid twd-place-content-center">
                <p>Loading Editor ...</p>
            </div>
            <div *ngIf="error" class="twd-z-10 twd-absolute twd-w-full mat-title twd-h-full twd-bg-white/40 twd-grid twd-place-content-center">
                <p>Failed to load the editor</p>
                <button mat-raised-button color="primary" class="!twd-mx-auto" (click)="loadEditor()">Retry</button>
            </div>

            <textarea [id]="id"></textarea>
        </div>
    `,
    styleUrls: ['./tinymce-email.component.scss']
})
export class EditorComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy, IEmailEditor {
    /**
     * ID for tinymce's textare selector
     */
    id: string;

    /**
     * Editor instance
     */
    _editor: Editor;

    /**
     * body of the email
     */
    @Input()
    body: string;

    /**
     * body's emitter to set 2-way binding
     */
    @Output()
    bodyChange = new EventEmitter();

    /**
     * Top Most elemet
     */
    @ViewChild('hostEl')
    host: ElementRef<HTMLDivElement>;

    /**
     * Intersection observer's instance
     */
    _intersection: IntersectionObserver;

    /**
     * Loadin flag
     */
    loading = true;

    /**
     * Error flag
     */
    error = false;

    /**
     * Subject that is used as takeUntil limiter for unsubscribing all subsctiption on destroy
     */
    unsubscribeAll$: Subject<boolean> = new Subject<boolean>();

    /**
     * Debounce time of editor
     */
    debounce = {
        duration: 800,
        timeout: null
    };

    /**
     * Flag to check if editor content has changed since 2-way binding's
     * event emitter call to take effect in ngOnchanges
     */
    _editorContentChanged = false;

    constructor(@Inject(APP_BASE_HREF) private baseHref: string) {}

    /**
     * Lifecycle hook
     */
    ngOnInit(): void {
        this.id = TUtils.Generic.uuid();
    }

    /**
     * Lifecycle hoook
     * @param {SimpleChanges} changes
     */
    ngOnChanges(changes: SimpleChanges): void {
        if (changes.body && this._editor && !this._editorContentChanged && changes.body.currentValue !== this._editor.getContent()) {
            this._editor.setContent(changes.body.currentValue);
        }
        if (this._editorContentChanged) {
            this._editorContentChanged = false;
        }
    }

    /**
     * Lifecycle hook
     */
    ngOnDestroy(): void {
        this.unsubscribeAll$.unsubscribe();
        this._editor?.destroy();
        this._intersection.disconnect();
    }

    /**
     * After view init
     */
    ngAfterViewInit(): void {
        this.loadEditor();
    }

    /**
     * Loads editor
     */
    loadEditor(): void {
        this.loading = true;
        this.error = false;
        this._editor?.destroy();
        setTimeout(() => {
            tinymce
                .init({
                    selector: `textarea#${this.id}`,
                    min_height: 200,
                    height: '100%',
                    menubar: false,
                    fontsize_formats: '8pt 9pt 10pt 11pt 12pt 26pt 36pt',
                    forced_root_block: false,
                    // force_br_newlines: true,
                    // force_p_newlines: false,
                    branding: false,
                    base_url: `${this.baseHref}assets/tinymce/`,
                    content_css: `${this.baseHref}assets/tinymce/editor.css`,
                    plugins: ['table', 'advlist', 'autolink', 'lists', 'searchreplace', 'wordcount'],
                    //     'advlist autolink lists link image charmap print preview anchor',
                    //     'searchreplace visualblocks code fullscreen',
                    //     'insertdatetime media table paste code wordcount'
                    // ],
                    toolbar: `
                        undo redo | formatselect | table | 
                        bold italic backcolor | alignleft aligncenter 
                        alignright alignjustify | bullist numlist outdent indent |  
                        removeformat
                        `,
                    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                    setup: (editor) => {
                        editor.on('init', () => {
                            editor.setContent(this.body || '');
                            this._editor = editor;
                            editor.focus();
                            const setEmailbody = () => {
                                this.body = editor.getContent();
                                this.bodyChange.emit(this.body);
                            };
                            fromEvent(editor, 'change')
                                .pipe(
                                    takeUntil(this.unsubscribeAll$),
                                    map(() => {
                                        this._editorContentChanged = !!this.body;
                                    }),
                                    debounceTime(this.debounce.duration)
                                )
                                .subscribe(setEmailbody);
                            fromEvent(editor, 'blur').pipe(takeUntil(this.unsubscribeAll$)).subscribe(setEmailbody);
                        });
                    }
                })
                .then(() => {
                    this.loading = false;
                    this.error = false;
                })
                .catch((err) => {
                    console.error('Unable to load editor');
                    console.error(err);
                    this.loading = false;
                    this.error = true;
                });
        });

        this._intersection = new IntersectionObserver((e) => {
            e.forEach((el) => {
                if (el.isIntersecting) {
                    this._editor?.show();
                } else {
                    this._editor?.hide();
                }
            });
        });
        this._intersection.observe(this.host.nativeElement);
    }
}

/**
 * EmailEditorModule
 */
@NgModule({
    declarations: [EditorComponent],
    exports: [EditorComponent],
    imports: [CommonModule, MaterialModule]
})
export class EmailEditorModule {}
