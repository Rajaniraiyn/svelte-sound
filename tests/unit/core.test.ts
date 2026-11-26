import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { createSound, type Sound } from '../../src/web-audio.js';

class Param {
  value = 1;
  setTargetAtTime(value: number) {
    this.value = value;
  }
}

class Source {
  buffer: unknown;
  playbackRate = new Param();
  loop = false;
  onended: (() => void) | null = null;
  start = mock();
  stop = mock();
  connect = mock();
  disconnect = mock();
}

class Context {
  static instances: Context[] = [];
  state = 'suspended';
  currentTime = 0;
  destination = {};
  sources: Source[] = [];
  gain = { gain: new Param(), connect: mock(), disconnect: mock() };
  resume = mock(async () => {
    this.state = 'running';
  });
  close = mock(async () => {
    this.state = 'closed';
  });
  decodeAudioData = mock(async () => ({ duration: 0.1 }));
  createGain() {
    return this.gain;
  }
  createBufferSource() {
    const source = new Source();
    this.sources.push(source);
    return source;
  }
  constructor() {
    Context.instances.push(this);
  }
}

const originals = new Map<string, PropertyDescriptor | undefined>();
function stub(key: string, value: unknown) {
  if (!originals.has(key))
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
  Object.defineProperty(globalThis, key, {
    configurable: true,
    writable: true,
    value,
  });
}
type Fetch = (...args: Parameters<typeof fetch>) => Promise<Response>;
const fetchMock = mock<Fetch>(async () => response());
const owners: Sound[] = [];
function sound(src = '/click.mp3', options = {}) {
  const player = createSound(src, options);
  owners.push(player);
  return player;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function response() {
  return new Response(new ArrayBuffer(16));
}
const context = () => Context.instances.at(-1)!;

beforeEach(() => {
  Context.instances = [];
  stub('window', {});
  stub('AudioContext', Context);
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => response());
  stub('fetch', fetchMock);
});
afterEach(() => {
  for (const player of owners.splice(0)) player.destroy();
  for (const [key, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
  originals.clear();
});

describe('createSound', () => {
  it('can be created and destroyed during SSR without browser work', async () => {
    stub('window', undefined);
    const player = sound();
    expect(fetch).not.toHaveBeenCalled();
    expect(Context.instances).toHaveLength(0);
    await expect(player.play()).rejects.toThrow('requires a browser');
    expect(player.state.status).toBe('error');
    player.destroy();
    player.destroy();
  });

  it('shares concurrent fetches and decoding across controllers', async () => {
    const first = sound();
    const second = sound();
    await Promise.all([first.load(), first.load(), second.load()]);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(Context.instances).toHaveLength(1);
    expect(context().decodeAudioData).toHaveBeenCalledTimes(1);
    await Promise.all([first.play(), second.play()]);
    expect(context().sources).toHaveLength(2);
    first.destroy();
    expect(context().close).not.toHaveBeenCalled();
    second.destroy();
    expect(context().close).toHaveBeenCalledTimes(1);
  });

  it('resumes within the interaction before the network resolves', async () => {
    const network = deferred<Response>();
    fetchMock.mockReturnValue(network.promise);
    const playing = sound().play();
    expect(context().resume).toHaveBeenCalledTimes(1);
    expect(context().sources).toHaveLength(0);
    network.resolve(response());
    await expect(playing).resolves.toBe(true);
    expect(context().sources[0].start).toHaveBeenCalledTimes(1);
  });

  it('cancels pending plays when stopped without discarding the buffer', async () => {
    const network = deferred<Response>();
    fetchMock.mockReturnValue(network.promise);
    const player = sound();
    const pending = player.play();
    player.stop();
    network.resolve(response());
    await expect(pending).resolves.toBe(false);
    expect(context().sources).toHaveLength(0);
    await expect(player.play()).resolves.toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('never starts playback after destroy before scheduling', async () => {
    const player = sound();
    await player.load();
    const pending = player.play();
    player.destroy();
    await expect(pending).resolves.toBe(false);
    expect(context().sources).toHaveLength(0);
    await expect(player.play()).rejects.toThrow('destroyed');
  });

  it('keeps shared requests alive until the last owner leaves', async () => {
    const network = deferred<Response>();
    fetchMock.mockReturnValue(network.promise);
    const first = sound();
    const second = sound();
    const a = first.load();
    const b = second.load();
    const signal = fetchMock.mock.calls[0][1]!.signal!;
    first.destroy();
    expect(signal.aborted).toBe(false);
    network.resolve(response());
    await Promise.all([a, b]);
    second.destroy();
    expect(signal.aborted).toBe(true);
  });

  it('aborts an unneeded fetch and allows a fresh controller to retry', async () => {
    fetchMock.mockImplementationOnce(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init!.signal!.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        }),
    );
    const first = sound();
    const pending = first.load();
    first.destroy();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await expect(sound().load()).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it.each(['network', 'http', 'decode'])(
    'retries after a %s failure',
    async (failure) => {
      const player = sound();
      if (failure === 'network')
        fetchMock.mockRejectedValueOnce(new Error('Offline'));
      if (failure === 'http')
        fetchMock.mockResolvedValueOnce(new Response(null, { status: 404 }));
      if (failure === 'decode') {
        const loading = player.load();
        context().decodeAudioData.mockRejectedValueOnce(
          new Error('Invalid audio'),
        );
        await expect(loading).rejects.toThrow();
      } else await expect(player.load()).rejects.toThrow();
      await expect(player.play()).resolves.toBe(true);
      expect(fetch).toHaveBeenCalledTimes(2);
    },
  );

  it('preserves zero volume and updates active voices without reloading', async () => {
    const player = sound('/click.mp3', { volume: 0 });
    await player.play();
    expect(context().gain.gain.value).toBe(0);
    player.configure({ volume: 0.3, rate: 2, loop: true });
    expect(context().gain.gain.value).toBe(0.3);
    expect(context().sources[0].playbackRate.value).toBe(2);
    expect(context().sources[0].loop).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
    player.configure({ volume: undefined });
    expect(context().gain.gain.value).toBe(1);
  });

  it('bounds overlapping plays and disconnects ended voices', async () => {
    const player = sound('/click.mp3', { maxVoices: 2 });
    await Promise.all([player.play(), player.play(), player.play()]);
    const [oldest, middle, latest] = context().sources;
    expect(oldest.stop).toHaveBeenCalledTimes(1);
    expect(oldest.disconnect).toHaveBeenCalledTimes(1);
    player.configure({ maxVoices: 1 });
    expect(middle.stop).toHaveBeenCalledTimes(1);
    latest.onended!();
    player.stop();
    expect(latest.disconnect).toHaveBeenCalledTimes(1);
    expect(latest.stop).not.toHaveBeenCalled();
  });

  it.each([
    { volume: -1 },
    { volume: 2 },
    { volume: NaN },
    { rate: 0 },
    { rate: Infinity },
    { maxVoices: 0 },
    { maxVoices: 1.5 },
  ])('rejects invalid options: %j', (options) => {
    expect(() => sound('/click.mp3', options)).toThrow(RangeError);
  });

  it('rejects empty sources and leaves valid settings intact after a bad update', async () => {
    expect(() => sound('')).toThrow(TypeError);
    const player = sound('/click.mp3', { volume: 0.2 });
    expect(() => player.configure({ volume: 5 })).toThrow(RangeError);
    await player.play();
    expect(context().gain.gain.value).toBe(0.2);
  });
});

describe('playback failures', () => {
  it('rejects when the browser cannot resume audio', async () => {
    const player = sound();
    await player.load();
    context().resume.mockResolvedValueOnce(undefined);
    await expect(player.play()).rejects.toThrow('Audio is suspended');
    expect(context().sources).toHaveLength(0);
  });

  it('keeps a loaded sound retryable after a rejected resume', async () => {
    const player = sound();
    await player.load();
    context().resume.mockRejectedValueOnce(new Error('Not allowed'));
    await expect(player.play()).rejects.toThrow('Not allowed');
    await expect(player.play()).resolves.toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('disconnects a failed source and allows the next play', async () => {
    const player = sound();
    await player.load();
    const createSource = context().createBufferSource.bind(context());
    context().createBufferSource = () => {
      const source = createSource();
      source.start.mockImplementationOnce(() => {
        throw new Error('Cannot start');
      });
      context().createBufferSource = createSource;
      return source;
    };
    await expect(player.play()).rejects.toThrow('Cannot start');
    expect(context().sources[0].disconnect).toHaveBeenCalledTimes(1);
    await expect(player.play()).resolves.toBe(true);
    player.stop();
    expect(context().sources[0].stop).not.toHaveBeenCalled();
  });
});

it('resolves a cancelled play as false even if its pending request fails', async () => {
  const network = deferred<Response>();
  fetchMock.mockReturnValueOnce(network.promise);
  const player = sound();
  const pending = player.play();
  player.stop();
  network.reject(new Error('Offline'));
  await expect(pending).resolves.toBe(false);
});

it('resolves false when destroy aborts a pending play', async () => {
  fetchMock.mockImplementationOnce(
    (_url, init) =>
      new Promise((_resolve, reject) => {
        init!.signal!.addEventListener('abort', () =>
          reject(new DOMException('Aborted', 'AbortError')),
        );
      }),
  );
  const player = sound();
  const pending = player.play();
  player.destroy();
  await expect(pending).resolves.toBe(false);
});
