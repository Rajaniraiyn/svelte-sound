<div align=center id=top>

# svelte-sound

[![TypeScript](https://badgen.net/badge/icon/typescript?icon=typescript&label)](https://typescriptlang.org) [![Npm package version](https://badgen.net/npm/v/svelte-sound)](https://npmjs.com/package/svelte-sound) [![GitHub license](https://badgen.net/github/license/Rajaniraiyn/svelte-sound)](LICENSE) ![Made for svelte](https://img.shields.io/badge/made%20for-svelte-red)

Svelte Actions to play interaction sounds on target DOM events

</div>

## Features

- Lightweight and performant
- Only [Howler](https://howlerjs.com) core is used
- Loads Howler using dynamic imports to support partial hydration
- Scalable (can be used in complex game interactions)
- Truly reactive by default

## Installation

```sh
npm i svelte-sound
```

or

```sh
yarn add svelte-sound
```

or

```sh
pnpm i svelte-sound
```

## Usage

`svelte-sound` can be used in three ways,

1. `sound`
2. `useSound`
3. `Sound` class

### `sound`

This can be directly used on elements within svelte as a svelte action.
This actions following mandatory options,
| Option | Type | Description |
| --- | --- | --- |
| `src` | `string` | The source of the sound file |
| `events` | `[PlayEvent, StopEvent?]` | An array of events to play and stop the sound |
and valid [Howler Core Options](https://github.com/goldfire/howler.js/#options) as optional options

```svelte
<script>
  import { sound } from "svelte-sound";
  import click_mp4 from "./assets/click.mp4";
</script>

<button use:sound={{src: click_mp4, events: ["click"]}}>
    Click Me!!
</button>
```

### `useSound`

This can be reused multiple times on multiple elements within svelte. This returns a svelte action.
This method accepts following parameters,
| Parameter | Type | Description |
| --- | --- | --- |
| `src` | `string` | The source of the sound file |
| `events` | `[PlayEvent, StopEvent?]` | An array of events to play and stop the sound |
| `options` | `HowlerOptions?` | An object of valid [Howler Core Options](https://github.com/goldfire/howler.js/#options) |

```svelte
<script>
  import { useSound } from "svelte-sound";
  import click_mp4 from "./assets/click.mp4";

  const click_sound = useSound(click_mp4, ["click"])
</script>

<button use:click_sound>
    Click Me!!
</button>

<!-- Options can be overwritten -->
<button use:click_sound={{events:["dblclick"]}}>
    Click Me Twice!!
</button>
```

### `Sound` class

This can be used to play the sound programmatically. This returns a `Sound` class instance.
This method accepts following parameters,
| Parameter | Type | Description |
| --- | --- | --- |
| `src` | `string` | The source of the sound file |
| `options` | `HowlerOptions?` | An object of valid [Howler Core Options](https://github.com/goldfire/howler.js/#options) |

```js
import { Sound } from "svelte-sound";
import click_mp4 from "./assets/click.mp4";

const click_sound = new Sound(click_mp4);

function playSound() {
  click_sound.play();
} // playSound can be called anywhere in the code
```

## Example

For usage example have a look at [example](example/) directory

## FAQs

> How to Stop the sound/audio?

You can always pass an event as the second element of the `events` array to stop the sound on that event.
e.g.

```svelte
<script>
  import { sound } from "svelte-sound";
  import click_mp4 from "./assets/click.mp4";
</script>

<button use:sound={{src: click_mp4, events: ["click", "dblclick"]}}>
    Click Me!!
</button>
```

In the above example the sound will be played on `click` and stopped on `dblclick`

Alternatively you can use `play` and `stop` methods added to the element by the action. To play or stop the sound you can call the respective methods on the element.
e.g.

```svelte
<script>
  import { sound } from "svelte-sound";
  import click_mp4 from "./assets/click.mp4";

  let button;
</script>

<button
  bind:this={button}
  on:dblclick={() => button.stop()}
  use:sound={{src: click_mp4, events: ["click"]}}>
    Click Me!!
</button>
```

In the above example the sound will be played on `click` and stopped on `dblclick` using the `stop` method which we done programmatically.

> How to use this library programmatically without any DOM events?

You can use Sound class exported by the package to play the sound programmatically.
e.g.

```js
import { Sound } from "svelte-sound";
import click_mp4 from "./assets/click.mp4";

const click_sound = new Sound(click_mp4);

function playSound() {
  click_sound.play();
}
```
In the above example the sound will be played on calling the `play` method of the `click_sound` object.

## License

[MIT](LICENSE)

<div align=center>

---

Made with ❤️ by [Rajaniraiyn](https://rajaniraiyn.github.io)

[`^^^ move to top ^^^`](#top)

</div>
