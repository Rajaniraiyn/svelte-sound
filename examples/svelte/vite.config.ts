import { soundSources } from '../vite.js';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  resolve: { alias: soundSources },
  plugins: [svelte({ configFile: false })],
});
