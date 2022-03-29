import { InteractionWidget } from '..';

/**
 * Voice bot transcript widget is used to show the transcripts of the voice/audio call
 * Example config:
 * ```json
 * {
 *       "Name": "Speech Transcripts",
 *       "Description": "",
 *       "Key": "SpeechTranscript",
 *       "Type": "tw-voice-bot-transcripts",
 *       "Config": {
 *           "Enabled": true,
 *           "Hidden": false,
 *           "Static": false,
 *           "Anchor": false,
 *           "AOT": false,
 *           "AutoOpen": false,
 *           "Icon": "",
 *           "Class": "",
 *           "Position": { "X": 2, "Y": 1 },
 *           "Actions": ["maximize", "float"],
 *           "ViewState": "restore",
 *           "Header": true,
 *           "Pinned": false
 *       },
 *       "Data": {}
 * }
 * ```
 */
export type TwVoiceBotTranscripts = InteractionWidget<TwVoiceBotTranscriptsData>;

export interface TwVoiceBotTranscriptsData {}
