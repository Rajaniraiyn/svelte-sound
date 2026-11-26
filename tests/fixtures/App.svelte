<script lang="ts">
  import { onDestroy, tick } from 'svelte';
  import { createSound, sound } from 'svelte-sound';
  import { createSound as createPlayer } from 'svelte-sound/web-audio';
  import click from '../../examples/assets/click.mp3';

  let volume = $state(0.5);
  let disabled = $state(false);
  let src = $state(click);
  let visible = $state(true);
  let preload = $state<false | 'intent'>(false);
  let event = $state<'click' | 'dblclick'>('click');
  let error = $state('');
  const report = (cause: Error) => {
    error = cause.message;
  };
  const player = createSound(() => ({ src, volume, disabled }));
  const external = createPlayer(click, { volume: 0.25 });
  onDestroy(() => external.destroy());

  export const getState = () => player.state;
  export const externalState = () => external.state;
  export async function change(options: {
    volume?: number;
    disabled?: boolean;
    missing?: boolean;
    visible?: boolean;
    event?: 'click' | 'dblclick';
    preload?: 'intent';
  }) {
    if (options.preload !== undefined) preload = options.preload;
    if (options.volume !== undefined) volume = options.volume;
    if (options.disabled !== undefined) disabled = options.disabled;
    if (options.missing !== undefined)
      src = options.missing ? '/missing.mp3' : click;
    if (options.visible !== undefined) visible = options.visible;
    if (options.event !== undefined) event = options.event;
    await tick();
  }
  export const load = () => player.load();
  export const stop = () => player.stop();
</script>

<button id="managed" onclick={() => player.play().catch(report)}>Managed</button
>
<button id="borrowed" {@attach sound({ player: external })}>Borrowed</button>
{#if visible}
  <button
    id="attached"
    {@attach sound(() => ({
      src,
      volume,
      disabled,
      preload,
      on: event,
      stopOn: 'pointerleave',
      onError: report,
    }))}>Attached</button
  >
{/if}
<p id="state">{player.state.status}:{player.state.playing}</p>
<p id="error">{error}</p>
