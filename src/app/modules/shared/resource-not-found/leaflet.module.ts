import { NgModule } from '@angular/core';

import { tileLayer, latLng } from 'leaflet';

const leafletModules = [
 tileLayer,
 latLng
];

@NgModule({
  imports: leafletModules,
  exports: leafletModules
})
export class LeafletModule { }
