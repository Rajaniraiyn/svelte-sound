import { createSound as createPlayer } from 'svelte-sound/web-audio';
import { mount, unmount } from 'svelte';
import renderer, { node } from './renderer.js';
import Scene from './Scene.svelte';

const target = node('fragment');
const scene = mount(Scene, { target, renderer, props: { createPlayer } });
const output = document.querySelector('pre')!;
function show() {
  output.textContent = JSON.stringify(
    target.children
      .filter((child) => child.kind === 'element')
      .map((child) => child.attributes),
    null,
    2,
  );
}
const observe = $effect.root(() => {
  $effect(() => {
    scene.getState();
    show();
  });
});
document.querySelector('#play')!.addEventListener('click', () => {
  void scene.play().catch(console.error);
});
document.querySelector('#stop')!.addEventListener('click', scene.stop);
document.querySelector('#dispose')!.addEventListener('click', async () => {
  await unmount(scene);
  observe();
  show();
});
