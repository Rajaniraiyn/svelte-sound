type Entry = {
  promise: Promise<AudioBuffer>;
  abort: AbortController;
  users: number;
};
type Engine = {
  context: AudioContext;
  buffers: Map<string, Entry>;
  users: number;
};
export type Resource = { engine: Engine; entry: Entry };

let shared: Engine | undefined;

export function acquire(src: string): Resource {
  if (typeof window === 'undefined' || typeof AudioContext === 'undefined') {
    throw new Error(
      'Sound playback requires a browser with Web Audio support.',
    );
  }
  const engine = (shared ??= {
    context: new AudioContext({ latencyHint: 'interactive' }),
    buffers: new Map(),
    users: 0,
  });
  let entry = engine.buffers.get(src);
  if (!entry) {
    const abort = new AbortController();
    const promise = fetch(src, { signal: abort.signal }).then(
      async (response) => {
        if (!response.ok)
          throw new Error(`Unable to load sound: ${response.status} ${src}`);
        const data = await response.arrayBuffer();
        abort.signal.throwIfAborted();
        return engine.context.decodeAudioData(data);
      },
    );
    entry = { promise, abort, users: 0 };
    engine.buffers.set(src, entry);
    const failed = entry;
    // Failed requests must not poison the shared cache.
    void promise.catch(() => {
      if (engine.buffers.get(src) === failed) engine.buffers.delete(src);
    });
  }
  entry.users++;
  engine.users++;
  return { engine, entry };
}

export function release(src: string, { engine, entry }: Resource) {
  if (--entry.users === 0) {
    entry.abort.abort();
    if (engine.buffers.get(src) === entry) engine.buffers.delete(src);
  }
  if (--engine.users === 0) {
    if (shared === engine) shared = undefined;
    void engine.context.close().catch(() => {});
  }
}
