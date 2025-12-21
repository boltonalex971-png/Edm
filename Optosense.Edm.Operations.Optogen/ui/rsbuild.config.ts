import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSass } from '@rsbuild/plugin-sass';

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginSass({ sassLoaderOptions: { warnRuleAsWarning: false } })
  ],
  dev: {
    assetPrefix: '/',
    liveReload: true,
    hmr: true,
  },
  output: {
    assetPrefix: '/apps/optogen',
    distPath: {
      root: 'build',
    }
  }, 
  html: {
    title: 'Edm Optogen app',
    favicon: './public/favicon.ico'
  },
  server: {
    open: true,
  }
});
