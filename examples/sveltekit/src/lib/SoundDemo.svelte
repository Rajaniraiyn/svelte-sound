<script lang="ts">
  import { onMount } from 'svelte';
  import { createSound, sound } from 'svelte-sound';
  import src from '../../../assets/click.mp3';
  let hydrated = $state(false);
  onMount(() => {
    hydrated = true;
  });
  let muted = $state(false);
  const click = createSound(() => ({ src, disabled: muted }));
</script>

<h1>SvelteKit sound</h1>
<nav>
  <a href="/">SSR + hydration</a> · <a href="/client">Client rendering</a>
</nav>
<label><input type="checkbox" bind:checked={muted} /> Mute</label>
<button id="play" onclick={() => click.play().catch(console.error)}>Play</button
>
<button {@attach sound(() => ({ src, disabled: muted, preload: 'intent' }))}
  >Preload on intent</button
>
<p id="status">{click.state.status}:{click.state.playing}</p>

<p id="mode">{hydrated ? 'Hydrated' : 'Server-rendered'}</p>
