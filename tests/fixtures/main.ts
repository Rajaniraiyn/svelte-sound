import { mount, unmount } from 'svelte';
import App from './App.svelte';

const audio = {
  contexts: [] as AudioContext[],
  gains: [] as GainNode[],
  starts: 0,
  stops: 0,
  requests: 0,
  duration: 0,
};
const NativeContext = window.AudioContext;
window.AudioContext = class extends NativeContext {
  constructor(options?: AudioContextOptions) {
    super(options);
    audio.contexts.push(this);
  }
  createGain() {
    const gain = super.createGain();
    audio.gains.push(gain);
    return gain;
  }
};
const start = AudioBufferSourceNode.prototype.start;
AudioBufferSourceNode.prototype.start = function (...args) {
  audio.starts++;
  audio.duration = this.buffer?.duration ?? 0;
  return start.apply(this, args);
};
const stop = AudioBufferSourceNode.prototype.stop;
AudioBufferSourceNode.prototype.stop = function (...args) {
  audio.stops++;
  return stop.apply(this, args);
};
const fetch = window.fetch;
window.fetch = Object.assign((...args: Parameters<typeof fetch>) => {
  audio.requests++;
  return fetch(...args);
}, fetch);
const app = mount(App, { target: document.getElementById('app')! });
const harness = { ...app, audio, unmount: () => unmount(app) };
Object.assign(window, { harness });

Object.assign(harness, {
  async mountCustom() {
    const { default: Scene } =
      await import('../../examples/renderer/src/Scene.svelte');
    const { default: renderer, node } =
      await import('../../examples/renderer/src/renderer.js');
    const { memoryPlayer, calls } = await import('./memory-player.js');
    const target = node('fragment');
    const scene = mount(Scene, {
      target,
      renderer,
      props: { createPlayer: memoryPlayer },
    });
    Object.assign(window, {
      custom: {
        ...scene,
        calls,
        snapshot: () =>
          target.children
            .filter((child) => child.kind === 'element')
            .map((child) => child.attributes),
        unmount: () => unmount(scene),
      },
    });
  },
  async mountAsync() {
    const { default: Component } = await import('./Async.svelte');
    mount(Component, { target: document.getElementById('app')! });
  },
});
