import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  outDir: '../dist',
  base: '/',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      // rolldown-vite 8 requires tsconfigPaths to be set explicitly
      // when any custom alias is configured.
      tsconfigPaths: false,
      alias: {
        '@app': fileURLToPath(new URL('../src', import.meta.url)),
      },
    },
  },
});
