import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewEncapsulation } from '@angular/core';
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
export class AvatarComponent implements OnInit, OnChanges {
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
     * Initial classes
     */
    @Input()
    public initialClass: string;

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
     * On Init
     * @method
     */
    ngOnInit(): void {
        if (!this.photoUrl && !this.matIcon) {
            this.showInitials = true;
            const randomIndex = Math.floor(Math.random() * Math.floor(this.colors.length));
            this.circleColor = this.circleColor || this.colors[randomIndex];
            this.initials = this.getInitial(this.name);
        }
    }

    /**
     * On Change
     * @param {SimpleChanges} changes
     */
    ngOnChanges(changes: SimpleChanges): void {
        // return for first change
        if (changes.name?.firstChange) {
            return;
        }

        // check if any change for photoUrl
        if (changes.photoUrl && changes.photoUrl.currentValue) {
            this.photoUrl = changes.photoUrl.currentValue;
            this.showInitials = false;
        } else if (changes.name && !this.photoUrl) {
            this.initials = this.getInitial(this.name);
            this.showInitials = true;
        }
    }

    /**
     * Get initial
     * @param {String} name
     */
    getInitial(name: string): string {
        let initials = '';
        const splitName = name.split(' ');
        if (splitName.length >= 2) {
            return splitName[0].charAt(0).toUpperCase() + splitName[1].charAt(0).toUpperCase();
        }

        for (let i = 0; i < name.length; i++) {
            if (name.charAt(i) === ' ') {
                continue;
            }
            if (name.charAt(i).toUpperCase() === name.charAt(i).toUpperCase()) {
                initials += name.charAt(i).toUpperCase();
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
