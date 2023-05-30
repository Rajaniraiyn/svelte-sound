import type { HowlOptions, Howl as THowl } from "howler";

declare global {
  interface HTMLElement {
    /**
     * Plays the sound
     * only works if the sound is created using the `svelte-sound` action
     */
    play: () => void;

    /**
     * Stops the sound
     * only works if the sound is created using the `svelte-sound` action
     */
    stop: () => void;
  }
}

/**
 * The events that is used to play the sound
 */
type PlayEvent = keyof HTMLElementEventMap;

/**
 * The events that is used to stop the sound
 */
type StopEvent = keyof HTMLElementEventMap;

type Options = {
  events: [PlayEvent, StopEvent?];
} & HowlOptions;

/**
 * Main Sound class
 * used to create and manage sounds by this library
 */
class Sound {
  private node: HTMLElement;
  private options: Options;

  private howl: THowl;

  constructor(node: HTMLElement, options: Options) {
    this.node = node;
    this.options = options;

    this.create();
  }

  /**
   * creates the sound
   */
  private async create() {
    const { Howl } = await import("howler/src/howler.core");
    const { src, events, loop, volume } = this.options;
    const sound: THowl = new Howl({
      src,
      loop: loop || false,
      volume: volume || 1,
      ...this.options,
    });

    this.howl = sound;

    const [playEvent, stopEvent] = events;

    this.node.play = this.play.bind(this);
    this.node.stop = this.stop.bind(this);

    this.node.addEventListener(playEvent, this.play.bind(this));

    this.node.addEventListener(stopEvent, this.stop.bind(this));
  }

  update(options: Options) {
    this.unload();
    this.options = options;
    this.create();
  }

  destroy() {
    this.stop();
    this.unload();
  }

  /**
   * plays the sound
   */
  private play() {
    this.howl.play();
  }

  /**
   * stops the sound
   */
  private stop() {
    this.howl.stop();
  }

  /**
   * Removes the event listeners attached to the node
   */
  private removeEventListeners() {
    const { events } = this.options;
    const [playEvent, stopEvent] = events;

    this.node.removeEventListener(playEvent, this.play.bind(this));

    this.node.removeEventListener(stopEvent, this.stop.bind(this));
  }

  /**
   * unloads the sound
   */
  private unload() {
    this.removeEventListeners();
    this.howl.unload();
  }
}

/**
 * Svelte Action to play sound effects
 */
export function sound(node: HTMLElement, options: Options) {
  return new Sound(node, options);
}

/**
 * Svelte Sound Reusable Action generator
 */
export function useSound(
  src: string | string[],
  events: [PlayEvent, StopEvent?],
  options?: Omit<Options, "src" | "events">
) {
  return (node: HTMLElement, overrideOptions?: Partial<Options>) => 
    new Sound(node, { src, events, ...options, ...overrideOptions });
}
