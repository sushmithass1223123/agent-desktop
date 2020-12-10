import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';
import { AVATAR_COLORS } from 'app/constants';

/**
 * Avatar component
 */
@Component({
    selector: 'avatar',
    templateUrl: './avatar.component.html',
    styleUrls: ['./avatar.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class AvatarComponent implements OnInit {
    /**
     * Photo Url
     */
    @Input()
    public photoUrl: string;

    /**
     * Icono to show
     */
    @Input()
    public matIcon: string;

    /**
     * Name of the user 
     */
    @Input()
    public name: string;

    /**
     * Classes
     */
    @Input()
    public classes: string;

    /**
     * Custom circle color
     */
    @Input()
    public circleColor: string;

    /**
     * Show initials of name
     */
    public showInitials = false;
    /**
     * Initials
     */
    public initials: string;

    /**
     * Colors for avatar
     */
    private colors = AVATAR_COLORS;

    /**
     * Lifecycle hooks
     * @method
     */
    ngOnInit(): void {
        if (!this.photoUrl && !this.matIcon) {
            this.showInitials = true;
            const randomIndex = Math.floor(Math.random() * Math.floor(this.colors.length));
            this.circleColor = this.circleColor || this.colors[randomIndex];
        }
    }

    /**
     * Get initial
     * @param {String} name
     */
    getInitial(name: string): string {
        let initials = '';
        // replace all special chars with space
        name = name.replace(/[^\w\s]/gi, ' ').toUpperCase();
        // generate the initials
        for (let i = 0; i < name.length; i++) {
            if (name.charAt(i) === ' ') {
                continue;
            }
            if (name.charAt(i) === name.charAt(i).toUpperCase()) {
                initials += name.charAt(i);

                if (initials.length === 2) {
                    break;
                }
            }
        }
        // check if the initials are empty the take first 2 char of name
        if (initials === '') {
            initials = name.substring(0, 2).toUpperCase();
        }
        return initials;
    }
}
