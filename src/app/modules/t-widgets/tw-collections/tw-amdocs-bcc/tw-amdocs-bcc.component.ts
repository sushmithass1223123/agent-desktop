import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { IWidget } from 'app/interfaces';
import { TwAmdocsBcc } from '@ad/types';

@Component({
    selector: 'tw-amdocs-bcc',
    templateUrl: './tw-amdocs-bcc.component.html',
    styleUrls: ['./tw-amdocs-bcc.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwAmdocsBccComponent extends TWidgetWrapper implements OnInit, OnDestroy {
    // holds all the data related to this widget from the config
    @Input() data: IWidget;

    caseData = {
        cases: [],
        submitted: false,
        caseText: '',
        caseId: ''
    };

    /**
     * Constructor
     */
    constructor() {
        super('TwAmdocsBccComponent');
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * A callback method that is invoked immediately after the default change detector has checked the directive's data-bound properties for the first time,
     * and before any of the view or content children have been checked. It is invoked only once when the directive is instantiated.
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        this.caseData.caseId = this.data.InteractionDetails?.UCID;
    }

    /**
     * A callback method that performs custom clean-up, invoked immediately before a directive, pipe, or service instance is destroyed.
     */
    ngOnDestroy(): void {
        // call the wrapper destroy method
        this.destroyWrapper();
    }

    // -----------------------------------------------------------------------------------------------------
    // @  Private Methods
    // -----------------------------------------------------------------------------------------------------

    // -----------------------------------------------------------------------------------------------------
    // @  Public Methods
    // -----------------------------------------------------------------------------------------------------

    addCase(): void {
        this.caseData.cases.push({
            name: this.caseData.caseText
        });
        this.caseData.submitted = true;
    }
}

// for more info visit - https://angular.io/api/core
