# API

## Managed sound

Call `createSound(input)` during component setup or inside an effect. `input` is a URL, an options object, or a synchronous getter returning either.

```ts
const click = createSound('/click.mp3');
const feedback = createSound(() => ({ src, volume, disabled: muted }));
```

| Member   | Behavior                                                                          |
| -------- | --------------------------------------------------------------------------------- |
| `play()` | Start a new voice; resolves `true` on start or `false` when disabled or cancelled |
| `stop()` | Stop active and pending plays, retaining the buffer                               |
| `load()` | Fetch and decode early without playing                                            |
| `state`  | Reactive snapshot: `status`, `playing`, `duration`, `error`                       |

`status` is `idle`, `loading`, `ready`, `error`, or `destroyed`. `playing` counts active voices; `duration` is seconds. `load()` and `play()` reject on failure. Background preload failures appear in `state.error`. Pending work from a replaced or disposed player cannot start playback or surface obsolete load errors.

| Option                 | Default           | Behavior                                                   |
| ---------------------- | ----------------- | ---------------------------------------------------------- |
| `src`                  | Required          | One audio URL; remote sources need CORS                    |
| `volume` / `rate`      | `1` / `1`         | Volume 0–1; positive speed, which also changes pitch       |
| `loop` / `maxVoices`   | `false` / `8`     | Repeat; stop the oldest voice when the limit is reached    |
| `disabled` / `preload` | `false` / `false` | Stop and block plays; load after mounting                  |
| `createPlayer`         | Native Web Audio  | Factory implementing the `Sound` contract from `/renderer` |

Changing the URL or factory replaces the owned player. Other options update the existing player. Svelte destroys it when its effect scope ends. Methods become available after mounting; calling `load()` before then rejects and `play()` resolves `false`.

## DOM attachment

Import `sound` from `svelte-sound`. It accepts the same URL/object/getter input, plus:

| Option          | Default           | Behavior                                                                               |
| --------------- | ----------------- | -------------------------------------------------------------------------------------- |
| `on` / `stopOn` | `'click'` / unset | DOM events for play / stop                                                             |
| `preload`       | `false`           | `true`: mount; `'intent'`: hover, focus, or pointer down                               |
| `onError`       | unset             | Handle failures; otherwise dispatch bubbling `sounderror` with the `Error` in `detail` |
| `player`        | unset             | Use existing `load` / `play` / `stop` controls instead of `src`                        |

```svelte
<button {@attach sound(() => ({ src, volume, preload: 'intent' }))}>Save</button
>
<button
  {@attach sound({ player: click, on: 'pointerenter', stopOn: 'pointerleave' })}
>
  Preview
</button>
```

A supplied player keeps its settings and ownership. Removing the attachment removes listeners; its owner decides when to stop or destroy playback. `disabled` and `stopOn` stop all voices on that player.

## Manual and custom engines

`createSound(src, options)` from `svelte-sound/web-audio` is framework independent. It exposes the same controls and state, plus `configure(options)`, `subscribe(listener)`, and `destroy()`.

```ts
import { createSound as createPlayer } from 'svelte-sound/web-audio';
const player = createPlayer('/click.mp3', { volume: 0.5 });
await player.play();
player.destroy();
```

`configure()` merges options; `undefined` restores defaults. Invalid numeric values throw `RangeError`. `subscribe()` immediately emits the current snapshot and returns an unsubscribe function. Manual owners must call `destroy()`.

Pass `createPlayer` to the managed API to adapt another engine. It must return a `Sound`, report state through `subscribe`, and release its resources in `destroy`. Backend-specific effects, streaming, or native audio stay in that adapter rather than expanding the common controls.

## SvelteKit and custom renderers

No audio context, fetch, or preload runs during SSR. The initial snapshot is `idle` on both server and client; Svelte effects begin after hydration. Create the sound in the component or layout that should own it, not in a shared server module. Share controls with Svelte context when children need the same player.

Import managed controls from `svelte-sound/renderer` for a path with no DOM or Web Audio dependency. Its `createPlayer` factory is required. It works in a custom renderer's effect scope; use an injected engine outside browsers. The `sound` attachment requires an HTML element and Web Audio requires a browser. Experimental renderer and async compiler flags belong to the consuming app.

The package uses public runes, `untrack`, attachments, and `svelte/events`. Svelte schedules reactivity and rendering; the package does not assign renderer priorities or play audio during render. Always initiate playback through user intent. Use a mute control and visible feedback.
