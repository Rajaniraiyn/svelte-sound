import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    minify: "terser",
    lib: {
      entry: "src/sound.ts",
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: ["howler"],
      output: {
        globals: {
          howler: "Howler",
        },
      },
    },
  },
  plugins: [dts()],
});
