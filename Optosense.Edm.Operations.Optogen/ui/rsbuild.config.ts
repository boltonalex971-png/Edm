import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSass } from '@rsbuild/plugin-sass';
import * as path from 'node:path';

// `@microprojects/edm-components` is junctioned in via `file:` and ships its
// own dev `node_modules`. Without these aliases both React copies get bundled
// (one resolved from here, one from edm-components/node_modules) and hooks
// crash with "Cannot read properties of null (reading 'useState')".
const reactDir    = path.resolve(__dirname, 'node_modules/react');
const reactDomDir = path.resolve(__dirname, 'node_modules/react-dom');

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginSass({ sassLoaderOptions: { warnRuleAsWarning: false } })
  ],
  resolve: {
    alias: {
      react:       reactDir,
      'react-dom': reactDomDir,
    },
  },
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
