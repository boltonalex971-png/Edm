import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginEslint } from '@rsbuild/plugin-eslint';

export default defineConfig({
  plugins: [
	pluginReact(),
	pluginEslint()
  ],
  html: {
    title: 'Edm Technology',
    favicon: './public/favicon.ico',
  },
  output: {
    assetPrefix: '/',
    distPath: {
      root: 'build',
    },
  },
  dev: {
    assetPrefix: '/',
    liveReload: true,
    hmr: true,
  },
  server: {
    open: true,
  }
});

