<svelte:options customRenderer="./renderer.js" />

<script lang="ts">
  import { tick } from 'svelte';
  import { createSound, type RendererSoundConfig } from 'svelte-sound/renderer';
  import click from '../../assets/click.mp3';
  let { createPlayer }: { createPlayer: RendererSoundConfig['createPlayer'] } = $props();
  let src = $state(click);
  const audio = createSound(() => ({ src, createPlayer }));
  export const play = () => audio.play();
  export const stop = () => audio.stop();
  export const getState = () => audio.state;
  export async function replace(srcValue: string) { src = srcValue; await tick(); }
</script>

<sound-status status={audio.state.status} playing={audio.state.playing} />
