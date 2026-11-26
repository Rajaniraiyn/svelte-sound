import {
  createSound as createManagedSound,
  type RendererSoundConfig,
  type ReactiveSound,
} from './renderer.svelte.js';
import { createSound as createWebAudio } from './web-audio.js';

export type SoundConfig = Omit<RendererSoundConfig, 'createPlayer'> & {
  createPlayer?: RendererSoundConfig['createPlayer'];
};

/** A Svelte-owned sound using Web Audio unless a factory is supplied. */
export function createSound(
  input: string | SoundConfig | (() => string | SoundConfig),
): ReactiveSound {
  return createManagedSound(() => {
    const value = typeof input === 'function' ? input() : input;
    const options = typeof value === 'string' ? { src: value } : value;
    return { ...options, createPlayer: options.createPlayer ?? createWebAudio };
  });
}
