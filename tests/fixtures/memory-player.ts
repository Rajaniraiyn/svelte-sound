import {
  initialState,
  type Sound,
  type SoundState,
} from 'svelte-sound/renderer';

export const calls = { created: 0, destroyed: 0 };
export function memoryPlayer(): Sound {
  calls.created++;
  let state = initialState;
  const listeners = new Set<(state: SoundState) => void>();
  function update(next: Partial<SoundState>) {
    state = { ...state, ...next };
    for (const listener of listeners) listener(state);
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
    load: async () => {
      update({ status: 'ready' });
    },
    play: async () => {
      update({ status: 'ready', playing: 1 });
      return true;
    },
    stop: () => {
      update({ playing: 0 });
    },
    configure() {},
    destroy() {
      calls.destroyed++;
      update({ status: 'destroyed', playing: 0 });
    },
  };
}
