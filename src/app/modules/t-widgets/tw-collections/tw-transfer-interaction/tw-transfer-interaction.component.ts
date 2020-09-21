import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { fuseAnimations } from '@fuse/animations';
import { FuseConfigService } from '@fuse/services/config.service';
import { FuseConfig } from '@fuse/types';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { IWidget } from 'app/interfaces';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'tw-transfer-interaction',
    templateUrl: './tw-transfer-interaction.component.html',
    styleUrls: ['./tw-transfer-interaction.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class TwTransferInteractionComponent extends TWidgetWrapper implements OnInit, OnDestroy {

    // holds all the data related to this widget from the config
    @Input() data: IWidget;

    fuseConfig: FuseConfig;

    mainLabel = 'Agent ID';
    switcherList = [
        {
            key: 'agentList',
            label: 'Agent List',
            textLabel: 'Agent ID'
        },
        {
            key: 'skillList',
            label: 'Skill List',
            textLabel: 'Skill'
        }
    ];
    activeSwitcher = 'agentList';
    searchTerm = '';
    agentListTable = {
        source: new MatTableDataSource([]),
        columns: ['FirstName', 'LastName', 'AgentID', 'Status']
    };

    skillListTable = {
        source: new MatTableDataSource([]),
        columns: ['Name', 'VDN', 'ID', 'Stf', 'Avl', 'CIQ']
    };

    /**
     * Constructor
     * @param {FuseConfigService} _fuseConfigService
     * @param {AppDataService} _appDataService
     */
    constructor(
        private _fuseConfigService: FuseConfigService
    ) {
        super();
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

        this._fuseConfigService.config
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe(
                (config: any) => {
                    this.fuseConfig = config;
                }
            );

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

    public switchTab(item: { key: string }): void {
        this.activeSwitcher = item.key;
    }

    public filterAgents(): void {

    }
}

// for more info visit - https://angular.io/api/core
