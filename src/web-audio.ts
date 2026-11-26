import { acquire, release, type Resource } from './audio.js';
import {
  initialState,
  type Sound,
  type SoundOptions,
  type SoundState,
} from './core.js';
export type { Sound, SoundOptions, SoundState } from './core.js';

type Settings = Required<SoundOptions>;
function settings(options: SoundOptions): Settings {
  const value = {
    volume: options.volume ?? 1,
    rate: options.rate ?? 1,
    loop: options.loop ?? false,
    maxVoices: options.maxVoices ?? 8,
  };
  if (!Number.isFinite(value.volume) || value.volume < 0 || value.volume > 1) {
    throw new RangeError('volume must be between 0 and 1.');
  }
  if (!Number.isFinite(value.rate) || value.rate <= 0) {
    throw new RangeError('rate must be a positive number.');
  }
  if (!Number.isSafeInteger(value.maxVoices) || value.maxVoices < 1) {
    throw new RangeError('maxVoices must be a positive integer.');
  }
  return value;
}

/** Create a lazy, SSR-safe sound controller for a short audio file. */
export function createSound(src: string, options: SoundOptions = {}): Sound {
  if (typeof src !== 'string' || !src.trim())
    throw new TypeError('src must be a non-empty URL.');
  let config = settings(options);
  let state = initialState;
  const listeners = new Set<(state: SoundState) => void>();
  function publish(change: Partial<SoundState>) {
    state = { ...state, ...change };
    for (const listener of listeners) listener(state);
  }
  function fail(reason: unknown) {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    publish({ status: 'error', error });
  }
  let resource: Resource | undefined;
  let loading: Promise<AudioBuffer> | undefined;
  let gain: GainNode | undefined;
  let destroyed = false;
  let revision = 0;
  const voices = new Set<AudioBufferSourceNode>();

  function assertAlive() {
    if (destroyed)
      throw new Error(
        'This sound has been destroyed. Create a new sound to play again.',
      );
  }

  function prepare() {
    assertAlive();
    if (!resource) {
      try {
        resource = acquire(src);
      } catch (error) {
        fail(error);
        throw error;
      }
      const current = resource;
      publish({ status: 'loading', error: null });
      loading = current.entry.promise
        .then((buffer) => {
          if (resource === current)
            publish({ status: 'ready', duration: buffer.duration });
          return buffer;
        })
        .catch((error: unknown) => {
          if (resource === current) {
            resource = undefined;
            loading = undefined;
            release(src, current);
            fail(error);
          }
          throw error;
        });
    }
    return { context: resource.engine.context, buffer: loading! };
  }

  function remove(voice: AudioBufferSourceNode) {
    voice.onended = null;
    voice.disconnect();
    voices.delete(voice);
    publish({ playing: voices.size });
  }

  function stopVoice(voice: AudioBufferSourceNode) {
    voice.stop();
    remove(voice);
  }

  function trim(limit: number) {
    while (voices.size > limit) stopVoice(voices.values().next().value!);
  }

  function stop() {
    revision++;
    for (const voice of voices) stopVoice(voice);
  }

  return {
    get state() {
      return state;
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      return () => {
        listeners.delete(listener);
      };
    },
    async load() {
      await prepare().buffer;
    },
    async play() {
      const ticket = revision;
      const { context, buffer } = prepare();
      // Resume before awaiting the fetch so the user gesture is still active.
      const resume =
        context.state === 'running' ? Promise.resolve() : context.resume();
      let decoded: AudioBuffer;
      try {
        [decoded] = await Promise.all([buffer, resume]);
      } catch (error) {
        if (destroyed || ticket !== revision) return false;
        fail(error);
        throw error;
      }
      if (destroyed || ticket !== revision) return false;
      if (context.state !== 'running') {
        const error = new Error(
          'Audio is suspended. Play from a user interaction.',
        );
        fail(error);
        throw error;
      }
      if (!gain) {
        gain = context.createGain();
        gain.gain.value = config.volume;
        gain.connect(context.destination);
      }
      trim(config.maxVoices - 1);
      const voice = context.createBufferSource();
      voice.buffer = decoded;
      voice.playbackRate.value = config.rate;
      voice.loop = config.loop;
      voice.connect(gain);
      voice.onended = () => remove(voice);
      voices.add(voice);
      try {
        voice.start();
      } catch (error) {
        remove(voice);
        fail(error);
        throw error;
      }
      publish({ status: 'ready', playing: voices.size, error: null });
      return true;
    },
    stop,
    configure(options) {
      assertAlive();
      config = settings({ ...config, ...options });
      if (gain && resource) {
        gain.gain.setTargetAtTime(
          config.volume,
          resource.engine.context.currentTime,
          0.01,
        );
      }
      for (const voice of voices) {
        voice.playbackRate.value = config.rate;
        voice.loop = config.loop;
      }
      trim(config.maxVoices);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stop();
      gain?.disconnect();
      gain = undefined;
      if (resource) release(src, resource);
      resource = undefined;
      loading = undefined;
      publish({ status: 'destroyed' });
      listeners.clear();
    },
  };
}
