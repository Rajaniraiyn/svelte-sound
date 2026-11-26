# Upgrade to 1.0

Use Svelte **^5.29.0** and ESM imports.

1. Replace `use:sound` with an attachment from `svelte-sound`.
2. Replace `useSound` with a reusable `sound(...)` attachment.
3. Replace `new Sound(src)` with managed `createSound(src)` from `svelte-sound`, or manual `createSound(src, options)` from `svelte-sound/web-audio`.

```svelte
<script>
  import { sound } from 'svelte-sound';
</script>

<button {@attach sound('/click.mp3')}>Save</button>
```

Replace `events: ['pointerenter', 'pointerleave']` with `on: 'pointerenter', stopOn: 'pointerleave'`. Use a getter for reactive options.

Managed players clean up with their Svelte effect scope. Manual players still require `destroy()`. Handle rejected `play()` and `load()` promises. Use `state` for reactive loading, errors, and voice counts.

Howler, CommonJS, source arrays, sprites, seeking, and injected element `.play()` / `.stop()` methods are removed. Use `<audio>` for long tracks or streaming, or adapt another engine with `createPlayer`.
