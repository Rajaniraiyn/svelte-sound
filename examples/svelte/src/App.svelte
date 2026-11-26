<script lang="ts">
  import { createSound, sound } from 'svelte-sound';
  import src from '../../assets/click.mp3';
  let volume = $state(0.5);
  let muted = $state(false);
  const click = createSound(() => ({ src, volume, disabled: muted }));
</script>

<main>
  <h1>Svelte sound</h1>
  <label
    >Volume <input
      type="range"
      min="0"
      max="1"
      step="0.01"
      bind:value={volume}
    /></label
  >
  <label><input type="checkbox" bind:checked={muted} /> Mute</label>
  <button onclick={() => click.play().catch(console.error)}>Play</button>
  <button onclick={click.stop}>Stop</button>
  <button
    {@attach sound(() => ({ src, volume, disabled: muted, preload: 'intent' }))}
    >Hover or focus, then play</button
  >
  <p role="status">{click.state.status} · {click.state.playing} playing</p>
  {#if click.state.error}<p role="alert">{click.state.error.message}</p>{/if}
</main>
