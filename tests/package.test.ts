import { test } from 'bun:test';
import { mkdtemp, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { $ } from 'bun';

test('packed exports and rune modules support the declared Svelte range', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'svelte-sound-'));
  const archive = join(directory, 'package.tgz');
  try {
    await $`bun run build`.quiet();
    await $`bun pm pack --ignore-scripts --filename ${archive}`.quiet();
    await Bun.write(
      join(directory, 'index.ts'),
      `
      import { createSound, sound, type ReactiveSound } from 'svelte-sound';
      import { createSound as createPlayer } from 'svelte-sound/web-audio';
      import type { Attachment } from 'svelte/attachments';
      export function setup() {
        const player: ReactiveSound = createSound('/click.mp3');
        const attach: Attachment<HTMLElement> = sound({ player });
        return { player, attach };
      }
      const player = createPlayer('/click.mp3');
      player.destroy();
    `,
    );
    for (const version of ['5.29.0', '5.59.2']) {
      await Bun.write(
        join(directory, 'package.json'),
        JSON.stringify({
          type: 'module',
          dependencies: { 'svelte-sound': archive, svelte: version },
        }),
      );
      await $`bun install --ignore-scripts`.cwd(directory).quiet();
      const compiler = join(process.cwd(), 'node_modules/typescript/bin/tsc');
      await $`bun ${compiler} --noEmit --strict --skipLibCheck --target es2022 --module esnext --moduleResolution bundler index.ts`
        .cwd(directory)
        .quiet();
      await $`bun index.ts`.cwd(directory).quiet();
      const compilerPath = await realpath(
        join(directory, 'node_modules/svelte/compiler/index.js'),
      );
      const { compileModule } = await import(pathToFileURL(compilerPath).href);
      for (const file of ['renderer.svelte.js', 'dom.svelte.js']) {
        const source = await Bun.file(
          join(directory, 'node_modules/svelte-sound/dist', file),
        ).text();
        for (const generate of ['client', 'server']) {
          compileModule(source, { filename: file, generate });
        }
      }
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 30000);

test('renderer entry runs in Bun without DOM or Web Audio globals', async () => {
  const { build } = await import('vite');
  const { svelte } = await import('@sveltejs/vite-plugin-svelte');
  const { soundSources } = await import('../examples/vite.js');
  const { mkdir } = await import('node:fs/promises');
  await mkdir('.vite', { recursive: true });
  const directory = await mkdtemp(join(process.cwd(), '.vite/native-'));
  try {
    await build({
      configFile: false,
      resolve: { alias: soundSources },
      plugins: [
        svelte({
          configFile: false,
          compilerOptions: { experimental: { customRenderer: true } },
        }),
      ],
      logLevel: 'error',
      build: {
        outDir: directory,
        target: 'esnext',
        lib: {
          entry: 'tests/fixtures/native.ts',
          formats: ['es'],
          fileName: () => 'native.js',
        },
        rollupOptions: { external: [/^svelte(?:\/|$)/] },
      },
    });
    await $`bun --conditions=svelte-custom-renderer ${join(directory, 'native.js')}`.quiet();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 15000);
