import { TemplateRef } from '@angular/core';
import { Widget } from '..';

/**
 * FOR INTERNAL USAGE ONLY.
 * Panel widget is used to display dynamic content inside a widget-looking layout.
 * @ignore
 */
export interface TwPanel extends Widget<TwPanelData> {}

/**
 * Tw Panel's data config
 * @ignore
 */
export type TwPanelData = {
    templateRef: TemplateRef<any>;
};
