import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { FuseConfig } from '@fuse/types';
import { IWidget } from 'app/interfaces';
import { AOTWidgetService } from '@services/aot-widget.service';

/**
 * Card header component
 * Contains all controls for maximise, float , collapse
 */
@Component({
    selector: 'tw-card-header',
    templateUrl: './tw-card-header.component.html',
    styleUrls: ['./tw-card-header.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwCardHeaderComponent implements OnInit {
    /**
     * Data from app config
     */
    @Input() data: IWidget;
    /**
     * Fuse config
     */
    @Input() fuseConfig: FuseConfig;
    /**
     * Current widget State
     */
    @Input() widgetState: Record<string, boolean>;

    /**
     * Maximise event emitter
     */
    @Output() maximize = new EventEmitter();

    /**
     * Floating event enmitter
     */
    @Output() float = new EventEmitter();

    /**
     * Collapse event emitter
     */
    @Output() collapse = new EventEmitter();

    /**
     * On destro event emitter
     */
    @Output() destroy = new EventEmitter();

    constructor(
        private _aotWidgetService: AOTWidgetService
    ) { }

    /**
     * Lifecycle hook
     */
    ngOnInit(): void { }

    /**
     * Maximize method
     */
    maximizeWidget(): void {
        this.maximize.emit();
    }

    /**
     * Float method
     */
    floatWidget(): void {
        this.float.emit();
    }

    /**
     * Collapse  method
     */
    collapseWidget(): void {
        this.collapse.emit();
    }

    /**
     * Need more description
     * Special method for AOT widget's destruction
     */
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
