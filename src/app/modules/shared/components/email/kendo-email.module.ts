import { Component, Input, NgModule } from '@angular/core';
import { EditorModule as KendoEditorModule } from '@progress/kendo-angular-editor';

@Component({
    selector: 'email-editor',
    template: ` <kendo-editor class="twd-h-full" [(ngModel)]="body" name="body">
        <kendo-toolbar [overflow]="true" class="twd-shadow-sm">
            <kendo-toolbar-buttongroup>
                <kendo-toolbar-button kendoEditorUndoButton></kendo-toolbar-button>
                <kendo-toolbar-button kendoEditorRedoButton></kendo-toolbar-button>
            </kendo-toolbar-buttongroup>
            <kendo-toolbar-buttongroup>
                <kendo-toolbar-button kendoEditorBoldButton></kendo-toolbar-button>
                <kendo-toolbar-button kendoEditorItalicButton></kendo-toolbar-button>
                <kendo-toolbar-button kendoEditorUnderlineButton></kendo-toolbar-button>
                <kendo-toolbar-button kendoEditorStrikethroughButton></kendo-toolbar-button>
            </kendo-toolbar-buttongroup>
            <kendo-toolbar-buttongroup>
                <kendo-toolbar-button kendoEditorSubscriptButton></kendo-toolbar-button>
                <kendo-toolbar-button kendoEditorSuperscriptButton></kendo-toolbar-button>
            </kendo-toolbar-buttongroup>
            <kendo-toolbar-buttongroup>
                <kendo-toolbar-button kendoEditorAlignLeftButton></kendo-toolbar-button>
                <kendo-toolbar-button kendoEditorAlignCenterButton></kendo-toolbar-button>
                <kendo-toolbar-button kendoEditorAlignRightButton></kendo-toolbar-button>
                <kendo-toolbar-button kendoEditorAlignJustifyButton></kendo-toolbar-button>
            </kendo-toolbar-buttongroup>
            <kendo-toolbar-dropdownlist kendoEditorFormat></kendo-toolbar-dropdownlist>
            <kendo-toolbar-dropdownlist kendoEditorFontSize></kendo-toolbar-dropdownlist>
            <kendo-toolbar-dropdownlist kendoEditorFontFamily></kendo-toolbar-dropdownlist>
            <kendo-toolbar-colorpicker kendoEditorForeColor></kendo-toolbar-colorpicker>
            <kendo-toolbar-colorpicker kendoEditorBackColor view="gradient"></kendo-toolbar-colorpicker>
            <kendo-toolbar-buttongroup>
                <kendo-toolbar-button kendoEditorInsertUnorderedListButton></kendo-toolbar-button>
                <kendo-toolbar-button kendoEditorInsertOrderedListButton></kendo-toolbar-button>
                <kendo-toolbar-button kendoEditorIndentButton></kendo-toolbar-button>
                <kendo-toolbar-button kendoEditorOutdentButton></kendo-toolbar-button>
            </kendo-toolbar-buttongroup>
            <kendo-toolbar-buttongroup>
                <kendo-toolbar-button kendoEditorCreateLinkButton></kendo-toolbar-button>
                <kendo-toolbar-button kendoEditorUnlinkButton></kendo-toolbar-button>
            </kendo-toolbar-buttongroup>
            <kendo-editor-insert-table-button></kendo-editor-insert-table-button>
            <kendo-toolbar-buttongroup>
                <kendo-toolbar-button kendoEditorAddColumnBeforeButton></kendo-toolbar-button>
                <kendo-toolbar-button kendoEditorAddColumnAfterButton></kendo-toolbar-button>
                <kendo-toolbar-button kendoEditorAddRowBeforeButton></kendo-toolbar-button>
                <kendo-toolbar-button kendoEditorAddRowAfterButton></kendo-toolbar-button>
            </kendo-toolbar-buttongroup>
            <kendo-toolbar-buttongroup>
                <kendo-toolbar-button kendoEditorDeleteColumnButton></kendo-toolbar-button>
                <kendo-toolbar-button kendoEditorDeleteRowButton></kendo-toolbar-button>
                <kendo-toolbar-button kendoEditorDeleteTableButton></kendo-toolbar-button>
            </kendo-toolbar-buttongroup>
        </kendo-toolbar>
    </kendo-editor>`
})
class EditorComponent {
    @Input()
    body: string;
}

@NgModule({
    declarations: [EditorComponent],
    imports: [KendoEditorModule],
    exports: [EditorComponent]
})
export class EmailEditorModule {}
