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

type SoundSource = HowlOptions["src"];
type SoundEvents = [PlayEvent, StopEvent?];
type SoundOptions = Omit<Options, "src" | "events">;

/**
 * Options for creating a SyntheticSound instance.
 */
type Options = {
  events: SoundEvents;
} & HowlOptions;

/**
 * A class representing a synthetic sound.
 */
export class Sound {
  private src: SoundSource;
  private options?: SoundOptions;
  private howl: THowl;

  /**
   * Creates a new SyntheticSound instance.
   * @param options The options for the sound.
   */
  constructor(src: SoundSource, options: SoundOptions = {}) {
    this.src = src;
    this.options = options;

    this.create();
  }

  /**
   * Creates the Howl instance for the sound.
   */
  private async create() {
    const { Howl } = await import("howler/src/howler.core");
    const { loop, volume } = this.options;
    const sound: THowl = new Howl({
      src: this.src,
      loop: loop || false,
      volume: volume || 1,
      ...this.options,
    });

    this.howl = sound;
  }

  /**
   * Updates the options for the sound.
   * @param options The new options for the sound.
   */
  update(options = this.options as Options) {
    this.unload();
    this.options = options;
    this.create();
  }

  /**
   * Destroys the sound instance.
   */
  destroy() {
    this.stop();
    this.unload();
  }

  /**
   * Plays the sound.
   */
  play() {
    this.howl.play();
  }

  /**
   * Stops the sound.
   */
  stop() {
    this.howl.stop();
  }

  /**
   * Unloads the sound.
   */
  private unload() {
    this.howl.unload();
  }
}

/**
 * A class representing a sound player that can be attached to an HTML element.
 * @extends Sound
 */
class SvelteSound extends Sound {
  node: HTMLElement;

  events: SoundEvents;

  /**
   * Creates a new Sound instance.
   * @param node The HTML element to attach the sound player to.
   * @param options The options to configure the sound player.
   */
  constructor(node: HTMLElement, { src, events, ...options }: Options) {
    super(src, options);

    this.node = node;

    this.events = events;
    this.attachControls();
  }

  /**
   * Adds event listeners to the HTML element to play and stop the sound.
   */
  attachControls() {
    const [playEvent, stopEvent] = this.events;

    this.node.play = this.play.bind(this);
    this.node.stop = this.stop.bind(this);

    this.node.addEventListener(playEvent, this.play.bind(this));

    this.node.addEventListener(stopEvent, this.stop.bind(this));
  }

  /**
   * Removes event listeners from the HTML element to play and stop the sound.
   */
  removeEventListeners() {
    const [playEvent, stopEvent] = this.events;

    this.node.removeEventListener(playEvent, this.play.bind(this));

    this.node.removeEventListener(stopEvent, this.stop.bind(this));
  }

  /**
   * Updates the sound player with new options.
   * @param options The new options to configure the sound player.
   */
  update(options: Parameters<Sound["update"]>[0]) {
    this.removeEventListeners();
    super.update(options);
    this.attachControls();
  }

  /**
   * Destroys the sound player and removes all event listeners.
   */
  destroy() {
    this.removeEventListeners();
    super.destroy();
  }
}

/**
 * Creates a new Sound instance.
 * @param node The HTML element to attach the sound player to.
 * @param options The options to configure the sound player.
 * @returns A new Sound instance.
 */
export function sound(node: HTMLElement, options: Options) {
  return new SvelteSound(node, options);
}

/**
 * Creates a new Sound instance with the given options.
 * @param src The source URL(s) of the sound.
 * @param events The events to listen to for playing and stopping the sound.
 * @param options The options to configure the sound player.
 * @returns A function that creates a new Sound instance with the given options.
 */
export function useSound(
  src: SoundSource,
  events: SoundEvents,
  options?: SoundOptions
) {
  return (node: HTMLElement, overrideOptions?: Partial<Options>) =>
    new SvelteSound(node, { src, events, ...options, ...overrideOptions });
}
