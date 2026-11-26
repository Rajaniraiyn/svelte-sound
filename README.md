# svelte-sound

Sound effects that follow Svelte's reactivity and component lifecycle.

```sh
bun add svelte-sound
```

## One button

```svelte
<script>
  import { sound } from 'svelte-sound';
</script>

<button {@attach sound('/click.mp3')}>Save</button>
```

## Reactive control

```svelte
<script>
  import { createSound } from 'svelte-sound';

  let volume = $state(0.5);
  let muted = $state(false);
  const click = createSound(() => ({
    src: '/click.mp3',
    volume,
    disabled: muted,
  }));
</script>

<button onclick={() => click.play().catch(console.error)}>Play</button>
<p>{click.state.status} · {click.state.playing} playing</p>
```

Svelte owns cleanup. Volume changes keep the buffer; source changes dispose the old player. Native completion and loading events update reactive state without polling.

Use `preload: 'intent'` on a DOM attachment to load on hover, focus, or pointer down. Use `preload: true` to load on mount.

## Why use it?

Web Audio provides playback. This package adds Svelte-owned resources, reactive options and state, shared decoding, cancellation, and attachment cleanup. It ships rune modules for your Svelte compiler to optimize for the client or server.

For custom renderers, import `createSound` from `svelte-sound/renderer` and supply an engine. That entry point imports neither DOM events nor Web Audio.

Requires **Svelte ^5.29.0**. Zero runtime dependencies beyond the Svelte peer. ESM only. Short effects, not streaming audio.

[API](docs/api.md) · [Examples](examples/README.md) · [Migration](MIGRATION.md) · [Contributing](CONTRIBUTING.md)

```sh
bun install
bun run dev
```

[MIT](LICENSE)
