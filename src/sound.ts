import { Howl } from "howler/src/howler.core";
import type { HowlOptions } from "howler";

type Options = {
  events: string[];
} & HowlOptions;

/**
 * Svelte Action to play sound effects
 */
export function sound(node: HTMLElement, options: Options) {
  let play = () => {},
    stop = () => {},
    unload = () => {};

  function create(options: Options) {
    const { src, events, loop, volume } = options;
    const sound = new Howl({
      src,
      loop: loop || false,
      volume: volume || 1,
      ...options,
    });

    play = () => sound.play();
    stop = () => sound.stop();
    unload = () => sound.unload();

    node.addEventListener(events[0], play);

    node.addEventListener(events[1], stop);
  }

  create(options);

  return {
    play,
    stop,
    update(options: Options) {
      unload();
      create(options);
    },
    destroy() {
      stop();
      unload();
    },
  };
}

/**
 * Svelte Sound Reusable Action generator
 */
export function useSound(
  src: string | string[],
  events: string[],
  options?: HowlOptions
) {
  return (node: HTMLElement, overrideOptions?: Partial<Options>) =>
    sound(node, { src, events, ...options, ...overrideOptions });
}
