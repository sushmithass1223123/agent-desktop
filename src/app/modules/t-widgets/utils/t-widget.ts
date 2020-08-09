import { Type } from '@angular/core';

export class TWidget {
  constructor(public component: Type<any>, public data: any) { }
}
