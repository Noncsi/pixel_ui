import { defineConfig } from 'vite';

/**
 * The showcase site, which is a separate build from the library.
 *
 * `vite.config.ts` builds the kit in library mode and leaves Lit external, so
 * a consumer brings their own copy. The site is the opposite: an ordinary
 * app that bundles everything it needs, including Lit, so the output is a
 * folder you can drop anywhere and open.
 *
 * `base: './'` keeps every URL relative, so the same build works at a domain
 * root, under a repository path on GitHub Pages, and from a file:// URL.
 */
export default defineConfig({
  root: 'site',
  base: './',
  build: {
    outDir: '../dist-site',
    emptyOutDir: true,
  },
});
