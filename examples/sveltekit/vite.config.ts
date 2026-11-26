import { soundSources } from '../vite.js';
import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: { alias: soundSources },
  plugins: [sveltekit({ adapter: adapter() })],
});
