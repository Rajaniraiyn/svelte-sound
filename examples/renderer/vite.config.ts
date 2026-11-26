import { soundSources } from '../vite.js';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: { alias: soundSources },
  plugins: [svelte()],
});
