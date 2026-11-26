export interface SoundOptions {
  /** Volume from 0 to 1. Default: 1. */
  volume?: number;
  /** Playback speed. Must be positive. Default: 1. */
  rate?: number;
  /** Repeat until stopped. Default: false. */
  loop?: boolean;
  /** Maximum simultaneous plays. Oldest play stops first. Default: 8. */
  maxVoices?: number;
}

export interface SoundState {
  readonly status: 'idle' | 'loading' | 'ready' | 'error' | 'destroyed';
  readonly playing: number;
  readonly duration: number;
  readonly error: Error | null;
}

export const initialState: SoundState = {
  status: 'idle',
  playing: 0,
  duration: 0,
  error: null,
};

export interface SoundControls {
  /** Fetch and decode without playing. Safe to call more than once. */
  load(): Promise<void>;
  /** Start playback. Resolves false if stop() cancels a pending play. */
  play(): Promise<boolean>;
  /** Stop all active and pending plays. Keeps the decoded buffer. */
  stop(): void;
}

export interface Sound extends SoundControls {
  readonly state: SoundState;
  subscribe(listener: (state: SoundState) => void): () => void;
  /** Update active and future plays without fetching again. */
  configure(options: SoundOptions): void;
  /** Stop playback and release resources. Safe to call more than once. */
  destroy(): void;
}
