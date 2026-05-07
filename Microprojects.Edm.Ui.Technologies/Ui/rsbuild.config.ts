import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginEslint } from '@rsbuild/plugin-eslint';
import { pluginSass } from "@rsbuild/plugin-sass";

export default defineConfig({
  plugins: [
	pluginReact(),
	pluginEslint(),
      pluginSass()
  ],
  html: {
    title: 'Edm Technology',
    favicon: './public/favicon.ico',
  },
  output: {
    assetPrefix: '/technologies',
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

