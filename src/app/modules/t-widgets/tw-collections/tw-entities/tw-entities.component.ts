import { TwEntities } from '@ad/types';
import { Component, Input, OnInit } from '@angular/core';
import { TWidgetWrapper } from '@twidgets/utils/widget-wrapper/tw-wrapper';
import { AVAILABLE_ENTITIES } from 'app/constants';
import { from, Observable } from 'rxjs';
import { catchError, filter, map } from 'rxjs/operators';

/**
 * Tw Entities component
 */
@Component({
    selector: 'tw-entities',
    templateUrl: './tw-entities.component.html',
    styleUrls: ['./tw-entities.component.scss']
})
export class TwEntitiesComponent extends TWidgetWrapper implements OnInit {
    /**
     * App config data
     */
    @Input() data: TwEntities<any>;

    /**
     * Current interaction data
     */
    interactionId: number;

    /**
     * Relevant entities
     */
    entities$: Observable<Record<string, string[]>[]>;

    constructor() {
        super('TwEntitiesComponent');
    }

    /**
     * Life cycle hook
     */
    ngOnInit(): void {
        // call the wrapper init method
        this.initWrapper(this.data);

        // set the interaction id from data
        this.interactionId = this.data.InteractionDetails.InteractionID;

        // get the entities

        const availableEntities = {};
        AVAILABLE_ENTITIES.forEach((entityConfig) => {
            availableEntities[entityConfig.key] = entityConfig.label;
        });

        const entitiesRegex = new RegExp(`\\b(${AVAILABLE_ENTITIES.map((entity) => entity.key).join('|')})[{0-9}]*?\\b$`);

        this.entities$ = from([this.data.InteractionDetails.JsonData]).pipe(
            map((data) => (data ? JSON.parse(data as any) : null)),
            filter((data) => !!data),
            map((intentData) => {
                return Object.values(intentData)
                    .map((intents: any) => {
                        return JSON.parse(intents);
                    })
                    .filter((x) => !!x);
            }),
            map((intentList: any[]) => {
                const intentMap = {};
                intentList.forEach(({ Data }) => {
                    Object.entries(Data).map(([entityName, entityData]) => {
                        const regRet = entitiesRegex.exec(entityName);
                        if (regRet) {
                            if (!intentMap[availableEntities[regRet[1]]]) {
                                intentMap[availableEntities[regRet[1]]] = [];
                            }
                            intentMap[availableEntities[regRet[1]]].push(entityData);
                        }
                    });
                });
                return Object.entries(intentMap).map(([key, value]) => ({ label: key, data: value }));
            }),
            catchError((err) => {
                return from([]);
            })
        );

        // const intentData = Object.values(JSON.parse(this.data.InteractionDetails.JsonData) || {}).map((data) =>
        //     data ? JSON.parse(data as any) : null
        // );

        // if (intentData) {
        //     const parsedEntities = Object.values(intentData);
        //     parsedEntities.forEach((entity) => {});
        //     parsedEntities.forEach((parsedEntity) => {
        //         if (parsedEntity) {
        //             Object.entries(parsedEntity).forEach((entity) => {
        //                 if (entity) {
        //                     const [entityName, entityData] = entity;
        //                     if (entityName.includes('PERSON')) {
        //                         people.push(entityData);
        //                     } else if (entityName.includes('ORG')) {
        //                         organizations.push(entityData);
        //                     } else if (entityName.includes('GPE')) {
        //                         locations.push(entityData);
        //                     }
        //                 }
        //             });
        //         }
        //     });
        // }
        // this.entities = [
        //     { label: 'People', data: people },
        //     { label: 'Organizations', data: organizations },
        //     { label: 'Locations', data: locations }
        // ];

        // console.log('#####################', this.entities);
    }
}
