import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { FuseConfig } from '@fuse/types';
import { IWidget } from 'app/interfaces';
import { AOTWidgetService } from '@services/aot-widget.service';

@Component({
    selector: 'tw-card-header',
    templateUrl: './tw-card-header.component.html',
    styleUrls: ['./tw-card-header.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwCardHeaderComponent implements OnInit {
    @Input() data: IWidget;
    @Input() fuseConfig: FuseConfig;
    @Input() widgetState: Record<string, boolean>;

    @Output() maximize = new EventEmitter();
    @Output() float = new EventEmitter();
    @Output() collapse = new EventEmitter();
    @Output() destroy = new EventEmitter();

    constructor(
        private _aotWidgetService: AOTWidgetService
    ) { }

    ngOnInit(): void { }

    maximizeWidget(): void {
        this.maximize.emit();
    }

    floatWidget(): void {
        this.float.emit();
    }

    collapseWidget(): void {
        this.collapse.emit();
    }

    destroyAOTWidget(): void {
        // get widget id
        const id = this.data.ID;
        // check if id is available, then call destroy
        if (id) {
            this._aotWidgetService.destroyWidget(id);
            this.destroy.emit();
        }
    }
}
