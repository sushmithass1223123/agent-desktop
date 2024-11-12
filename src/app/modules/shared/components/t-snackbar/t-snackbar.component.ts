import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { Component, ComponentRef, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { SnackbarStateTypes } from 'app/interfaces';

/**
 * Snackbar component
 */
@Component({
    selector: 't-snackbar',
    templateUrl: './t-snackbar.component.html',
    styleUrls: ['./t-snackbar.component.scss'],
    animations: [
        trigger("inOutAnimation", [
          state("in", style({ opacity: 1 })),
          transition(":enter", [
            animate(
              500,
              keyframes([
                style({ opacity: 0, offset: 0 }),
                style({ opacity: 0.25, offset: 0.25 }),
                style({ opacity: 0.5, offset: 0.5 }),
                style({ opacity: 0.75, offset: 0.75 }),
                style({ opacity: 1, offset: 1 }),
              ])
            )
          ]),
          transition(":leave", [
            animate(
              500,
              keyframes([
                style({ opacity: 1, offset: 0 }),
                style({ opacity: 0.75, offset: 0.25 }),
                style({ opacity: 0.5, offset: 0.5 }),
                style({ opacity: 0.25, offset: 0.75 }),
                style({ opacity: 0, offset: 1 }),
              ])
            )
          ])
        ])
      ]
})
export class TSnackbarComponent implements OnInit {
    /**
     * Reference of the component used in case of dismissing
     */
    @Input() ref: ComponentRef<TSnackbarComponent>;

    /**
     * Data needed to display snackbar
     */
    @Input() data: TSnackbarDataType;
    constructor(){
        
    }

    ngOnInit(): void {
        // Check if current snackbar is a loading snackbar, it should not be dismissed till the response received
        // check all the loading snackbars, it must have a dismiss method call on success / failure

        if(!this.data.loading) {
          setTimeout(() => {
            this.dismiss();
          }, this.data.duration);
        }   
    }

    /**
     * To close the snackbar
     */
    public dismiss(): void {
        this.ref.destroy();
    }

    /**
     * On click of the snackbar
     */
    public onClick(): void {
        if (typeof this.data.onClick === 'function') {
            this.dismiss();
            this.data.onClick();
        }
    }
}

/**
 * Snackbar component
 * TODO: style property can be made dynamic when the snackbar position is made configurable
 */
@Component({
  selector: 't-snackbar-container',
  template: '<ng-template #viewContainerRef></ng-template>',
  host: {
    'class': 'twd-flex twd-flex-col twd-absolute twd-top-3 left twd-z-50 twd-gap-1.5', 
    'style': 'left:50%; transform: translateX(-50%);'
  }
})
export class TSnackbarContainer {
  @ViewChild("viewContainerRef", { read: ViewContainerRef })
  vcr: ViewContainerRef;

  constructor() {}
}

export interface TSnackbarDataType {
    message: string;
    icon: string;
    state: SnackbarStateTypes;
    loading: boolean;
    onClick?: () => void;
    duration: number;
    id: number;
}
