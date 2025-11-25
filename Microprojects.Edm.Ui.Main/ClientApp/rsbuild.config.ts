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
    template: './public/index.html',
  },
  output: {
    assetPrefix: '/',
    distPath: {
      root: 'build',
    },
  },
  source: {
    // Compile all JS files and exclude core-js
    include: [{ not: /[\\/]core-js[\\/]/ }],
  },
  dev: {
    assetPrefix: '/',
    liveReload: true,
    hmr: true,
  }
});

