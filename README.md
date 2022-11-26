<div align=center id=top>

# svelte-sound

[![TypeScript](https://badgen.net/badge/icon/typescript?icon=typescript&label)](https://typescriptlang.org) [![Npm package version](https://badgen.net/npm/v/svelte-sound)](https://npmjs.com/package/svelte-sound) [![GitHub license](https://badgen.net/github/license/Rajaniraiyn/svelte-sound)](LICENSE) ![Made for svelte](https://img.shields.io/badge/made%20for-svelte-red)

Svelte Actions to play interaction sounds on target DOM events

</div>

## Features

- Lightweight and performant
- Only [Howler](https://howlerjs.com) core is used
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

`svelte-sound` can be used in two ways,

1. `sound`
2. `useSound`

### `sound`

This can be directly used on elements within svelte as a svelte action

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

This can be reused multiple times on multiple elements within svelte. This returns a svelte action

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

## License

[MIT](LICENSE)


<div align=center>

---

Made with ❤️ by [Rajaniraiyn](https://rajaniraiyn.github.io)

[`^^^ move to top ^^^`](#top)

</div>
