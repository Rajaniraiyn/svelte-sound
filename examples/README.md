# Examples

Run `bun install` at the repository root. The workspaces import the library source, so development does not need a prebuild.

| Command                | Example                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| `bun run dev`          | Vite + Svelte SPA: reactive playback, mute, intent preloading      |
| `bun run dev:kit`      | SvelteKit: `/` uses SSR and hydration; `/client` disables SSR      |
| `bun run dev:renderer` | Manual object-tree renderer: managed sound without DOM attachments |

The SPA was scaffolded with `bunx create-vite --template svelte-ts`; SvelteKit uses `bunx sv create`. The renderer is intentionally manual. All three have production builds: `bun run build:examples`.

The renderer example opts into Svelte's experimental custom renderer API. Its browser demo uses Web Audio; supply a `createPlayer` adapter when the renderer runs in a native or terminal environment.
