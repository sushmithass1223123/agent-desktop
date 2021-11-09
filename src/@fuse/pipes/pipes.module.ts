import { NgModule } from '@angular/core';
import { CamelCaseToDashPipe } from './camelCaseToDash.pipe';
import { FilterPipe } from './filter.pipe';
import { GetByIdPipe } from './getById.pipe';
import { HtmlToPlaintextPipe } from './htmlToPlaintext.pipe';
import { KeysPipe } from './keys.pipe';

@NgModule({
    declarations: [KeysPipe, GetByIdPipe, HtmlToPlaintextPipe, FilterPipe, CamelCaseToDashPipe],
    imports: [],
    exports: [KeysPipe, GetByIdPipe, HtmlToPlaintextPipe, FilterPipe, CamelCaseToDashPipe]
})
export class FusePipesModule {}
