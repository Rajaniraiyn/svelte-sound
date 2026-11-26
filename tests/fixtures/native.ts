import { mount, tick, unmount } from 'svelte';
import Scene from '../../examples/renderer/src/Scene.svelte';
import renderer, { node } from '../../examples/renderer/src/renderer.js';
import { memoryPlayer, calls } from './memory-player.js';

if (typeof window !== 'undefined' || typeof AudioContext !== 'undefined')
  throw new Error('This check must run without a DOM.');
const scene = mount(Scene, {
  target: node('fragment'),
  renderer,
  props: { createPlayer: memoryPlayer },
});
await tick();
await scene.play();
await tick();
if (scene.getState().playing !== 1)
  throw new Error('Renderer state did not update.');
await unmount(scene);
if (calls.destroyed !== 1)
  throw new Error('Renderer did not dispose its audio engine.');
