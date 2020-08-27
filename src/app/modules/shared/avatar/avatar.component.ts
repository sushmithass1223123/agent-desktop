import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';
import { avatarColors } from 'app/constants';
@Component({
    selector: 'avatar',
    templateUrl: './avatar.component.html',
    styleUrls: ['./avatar.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class AvatarComponent implements OnInit {

    @Input()
    public photoUrl: string;

    @Input()
    public matIcon: string;

    @Input()
    public name: string;

    @Input()
    public classes: string;

    @Input()
    public circleColor: string;

    public showInitials = false;
    public initials: string;

    private colors = avatarColors;

    ngOnInit(): void {

        if (!this.photoUrl && !this.matIcon) {
            this.showInitials = true;
            const randomIndex = Math.floor(Math.random() * Math.floor(this.colors.length));
            this.circleColor = this.circleColor || this.colors[randomIndex];
        }
    }

    getInitial(name: string): string {
        let initials = '';
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
        return initials;
    }

}
