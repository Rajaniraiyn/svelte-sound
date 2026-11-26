import { fileURLToPath } from 'node:url';

// Examples use source; package tests exercise the published files separately.
export const soundSources = [
  {
    find: /^svelte-sound$/,
    replacement: fileURLToPath(new URL('../src/index.ts', import.meta.url)),
  },
  {
    find: /^svelte-sound\/renderer$/,
    replacement: fileURLToPath(new URL('../src/renderer.ts', import.meta.url)),
  },
  {
    find: /^svelte-sound\/web-audio$/,
    replacement: fileURLToPath(new URL('../src/web-audio.ts', import.meta.url)),
  },
];
