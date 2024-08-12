import { NgModule } from '@angular/core';
import { CamelCaseToDashPipe } from './camelCaseToDash.pipe';
import { FilterPipe } from './filter.pipe';
import { GetByIdPipe } from './getById.pipe';
import { HtmlToPlaintextPipe } from './htmlToPlaintext.pipe';
import { KeysPipe } from './keys.pipe';
import { ObjectPipe } from './object.pipe';
import { CustomDatePipe } from './customDate.pipe';
import { MiscellaneousPipe } from './miscellaneous.pipe';

@NgModule({
    declarations: [
        KeysPipe,
        GetByIdPipe,
        HtmlToPlaintextPipe,
        FilterPipe,
        CamelCaseToDashPipe,
        ObjectPipe,
        CustomDatePipe,
        MiscellaneousPipe
    ],
    imports: [],
    exports: [
        KeysPipe,
        GetByIdPipe,
        HtmlToPlaintextPipe,
        FilterPipe,
        CamelCaseToDashPipe,
        ObjectPipe,
        CustomDatePipe,
        MiscellaneousPipe
    ]
})
export class FusePipesModule {}
