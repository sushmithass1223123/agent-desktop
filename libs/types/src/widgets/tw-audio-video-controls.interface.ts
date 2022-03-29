import { InteractionWidget } from '..';

/**
 * FOR INTERNAL USAGE ONLY.
 * Audio-Video widget handles the AV communication in AD
 */
export interface TwAudioVideoControls<T = any> extends InteractionWidget<TwAudioVideoControlsData, T> {}

export type TwAudioVideoControlsData = {
    /**
     * Flag to end interaaction on AV end
     */
    EndInteractionOnAVEnd?: boolean;
    /**
     * WebRTC test ref
     */
    WebRTCTest?: {
        /**
         * Flag to allow WebRTC test
         */
        Allowed: boolean;
        /**
         * Test url
         */
        Url: string;
        /**
         * FLag to send to customer
         */
        Customer: boolean;
    };
    /**
     * Flag to mute agent/customer audio/video on interaction hold
     */
    MuteAVOnHold?: {
        /**
         * Flag to mute agent audio
         */
        AgentAudio: boolean;
        /**
         * Flag to mute agent video
         */
        AgentVideo: boolean;
        /**
         * Flag to mute customer audio
         */
        CustomerAudio: boolean;
        /**
         * Flag to mute customer video
         */
        CustomerVideo: boolean;
    };
    /**
     * Source components from where this widget can be opened.
     */
    Source: 'TwChatControlsComponent' | 'InstantMessagingComponent';
    /**
     * AV event from opener
     */
    AVEvent?: any;
    /**
     * Opener of this widget
     */
    Opener?: any;
    /**
     * Send messsge function from opener
     */
    SendMessage?: () => {};
    /**
     * Flag to end call from opener
     */
    EndCall?: () => void;
};
