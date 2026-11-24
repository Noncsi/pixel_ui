import { copyFileSync, mkdirSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'pixel-ui',
    },
    rollupOptions: {
      // Consumers bring their own copy of Lit, so it is never bundled twice.
      external: [/^lit/],
    },
    // Keep the type declarations that tsc wrote into dist/types.
    emptyOutDir: false,
  },
  plugins: [
    {
      name: 'copy-tokens',
      closeBundle() {
        mkdirSync('dist', { recursive: true });
        copyFileSync('src/styles/tokens.css', 'dist/tokens.css');
      },
    },
  ],
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['test/**/*.test.ts'],
  },
});
