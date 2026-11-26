import { untrack } from 'svelte';
import { createSubscriber } from 'svelte/reactivity';
import { initialState } from './core.js';
import type { Sound, SoundControls, SoundOptions, SoundState } from './core.js';

export interface RendererSoundConfig extends SoundOptions {
  src: string;
  disabled?: boolean;
  preload?: boolean;
  /** Supply an audio engine with the same lifecycle and state contract. */
  createPlayer: (src: string, options?: SoundOptions) => Sound;
}

type Input<T> = T | (() => T);
const read = <T>(value: Input<T>): T =>
  typeof value === 'function' ? (value as () => T)() : value;

export interface ReactiveSound extends SoundControls {
  readonly state: SoundState;
}

/** Call during component setup or in an effect. Svelte owns the player. */
export function createSound(input: Input<RendererSoundConfig>): ReactiveSound {
  const config = $derived(read(input));
  const src = $derived(config.src);
  const factory = $derived(config.createPlayer);
  let current = $state.raw<{ player: Sound; track: () => void }>();
  let finalState = initialState;

  $effect(() => {
    const source = src;
    const create = factory;
    const player = untrack(() => create(source));
    const track = createSubscriber((update) => {
      let initial = true;
      return player.subscribe(() => {
        if (initial) initial = false;
        else update();
      });
    });
    current = { player, track };
    let preloaded = false;

    $effect(() => {
      const { volume, rate, loop, maxVoices, disabled, preload } = config;
      untrack(() => {
        player.configure({ volume, rate, loop, maxVoices });
        if (disabled) player.stop();
        if (preload && !disabled && !preloaded) {
          preloaded = true;
          void player.load().catch(() => {
            preloaded = false;
          });
        }
      });
    });

    return () => {
      player.destroy();
      finalState = player.state;
      current = undefined;
    };
  });

  return {
    get state() {
      current?.track();
      return current?.player.state ?? finalState;
    },
    async load() {
      const active = current;
      if (!active) throw new Error('Sound is not mounted.');
      try {
        await active.player.load();
      } catch (error) {
        if (current === active) throw error;
      }
    },
    async play() {
      const active = current;
      if (!active || untrack(() => config.disabled)) return false;
      try {
        const started = await active.player.play();
        return current === active && started;
      } catch (error) {
        if (current !== active) return false;
        throw error;
      }
    },
    stop: () => current?.player.stop(),
  };
}
