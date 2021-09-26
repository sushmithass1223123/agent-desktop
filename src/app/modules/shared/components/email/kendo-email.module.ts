import { Component, Input, NgModule } from '@angular/core';
import { EditorModule as KendoEditorModule } from '@progress/kendo-angular-editor';

@Component({
    selector: 'email-editor',
    template: ` <kendo-editor [(ngModel)]="body"> </kendo-editor> `
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
