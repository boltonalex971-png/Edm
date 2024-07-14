import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSass } from '@rsbuild/plugin-sass';

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginSass({ sassLoaderOptions: { warnRuleAsWarning: false } })
  ],
  dev: {
    assetPrefix: '/'
  },
  output: {
    assetPrefix: '/drivers/restapi'
  }

});
