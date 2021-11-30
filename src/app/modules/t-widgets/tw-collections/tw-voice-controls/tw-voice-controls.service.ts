import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class TwVoiceControlsService {
    cannedAudioPlayer: any;

    /**
     * Player Action
     * Need More Description
     * @method playerAction
     * @param {Number} action
     */
    playerAction(action: number): void {
        if (action === 1) {
            // play
            this.cannedAudioPlayer.resume();
            this.cannedAudioPlayer._adpState = 'playing';
        } else if (action === 2) {
            // pause
            this.cannedAudioPlayer.pause();
            this.cannedAudioPlayer._adpState = 'paused';
        } else {
            // stop
            this.cannedAudioPlayer.stop();
            this.cannedAudioPlayer = null;
        }
    }
}
