// Keep the game's original instruments; share only scheduling/resource management.
import {AudioEngine} from './vendor/audio.js';
import {createSessionAudio} from '../dopa-runtime/audio-runtime.mjs?v=all-smooth-1';
export const SessionAudio = createSessionAudio(AudioEngine);
