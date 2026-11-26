# Contribute

Use Bun 1.4.5+.

```sh
bun install
bun run validate
bun run build:examples
```

`validate` lints, checks types, runs Bun tests, and packages with `@sveltejs/package`. Browser tests use Bun.WebView: system WebKit on macOS, installed Chrome/Chromium on Linux and Windows. No Playwright or browser download step is required.

The root TypeScript config covers the library, tests, SPA, and custom renderer. SvelteKit keeps its own `$app/tsconfig` extension for framework route types. Renderer and async test compiler flags are local to those examples and fixtures.

| Entry                               | Responsibility                                   |
| ----------------------------------- | ------------------------------------------------ |
| `src/renderer.svelte.ts`            | Shared effect ownership and reactive state       |
| `src/sound.ts`                      | Default Web Audio adapter for managed sounds     |
| `src/dom.svelte.ts`                 | HTML events and intent preloading                |
| `src/web-audio.ts` / `src/audio.ts` | Manual controls, native playback, shared buffers |

Keep regression tests for behavior changes. Use direct names and comments that explain constraints. Commit format: `type: short description`; use `feat!:` for breaking changes.

## Publish

Inspect the archive with `bun run build && bun pm pack --ignore-scripts`. Publish locally with `bun publish` after signing in to npm.

Configure the npm trusted publisher once:

```sh
npm trust github svelte-sound --repo Rajaniraiyn/svelte-sound --file publish.yml --env npm --allow-publish
```

This requires an authenticated npm maintainer account with 2FA. The GitHub environment is named `npm`. You can also configure the same publisher in the package settings on npmjs.com.

To release, merge the version update, then push a matching tag:

```sh
git switch main
git pull --ff-only
git tag v1.0.0
git push origin v1.0.0
```

The tag workflow checks the version, validates, builds all examples, and packs with Bun. It publishes stable versions to npm's `latest` tag through OIDC, then creates a GitHub release with GitHub-generated notes and the package archive. Prerelease versions use `next` and a prerelease on GitHub. A GitHub release is created only after npm publication succeeds.

No npm token secret is needed. The workflow uses npm only for OIDC publication and provenance, which [Bun's publisher does not support](https://bun.sh/docs/pm/cli/publish). See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).

[MIT](LICENSE)
