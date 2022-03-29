import { InteractionWidget } from '..';

/**
 * Entities widget displays the list of entities in the current interaction.
 * This is used during email interaction.
 * Example Config:
 * ```json
 * {
 *      "Name": "Entities",
 *      "Description": "",
 *      "Key": "Entities",
 *      "Type": "tw-entities",
 *      "Config": {
 *          "Enabled": true,
 *          "Hidden": false,
 *          "Static": false,
 *          "Anchor": false,
 *          "AOT": false,
 *          "AutoOpen": false,
 *          "Icon": "verified_user",
 *          "Class": "",
 *          "Position": { "X": 2, "Y": 1 },
 *          "Actions": ["float"],
 *          "ViewState": "restore",
 *          "Header": true,
 *          "Pinned": false
 *       },
 *      "Data": {}
 *   }
 * ```
 */
export interface TwEntities<T> extends InteractionWidget<TwEntitiesData, T> {}

/**
 * Data config of the entities widget
 */
export type TwEntitiesData = {};
