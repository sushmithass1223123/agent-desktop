import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';

@Component({
    selector: 'twc-no-interaction',
    templateUrl: './twc-no-interaction.component.html',
    styleUrls: ['./twc-no-interaction.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TwcNoInteractionComponent implements OnInit {

    @Input() type: string;

    data = {
        'Name': 'No Interaction',
        'Description': 'No interaction yet!',
        'Type': 'tw-no-interaction',
        'Config': {
            'Static': false,
            'Anchor': false,
            'Icon': '',
            'Class': '',
            'Position': {
                'X': 3,
                'Y': 6
            },
            'Actions': [],
            'ViewState': 'restore',
            'PinState': false,
            'FloatState': false,
            'Resizable': false,
            'Header': true,
            'Disabled': false
        },
        'Data': {}
    };

    constructor() { }

    ngOnInit(): void {
    }

}
