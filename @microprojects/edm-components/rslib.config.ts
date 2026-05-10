import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSass } from '@rsbuild/plugin-sass';
import { defineConfig } from '@rslib/core';

export default defineConfig({
    source: {
        entry: {
            index: ['./src/**'],
        },
    },
    lib: [
        {
            bundle: false,
            dts: true,
            format: 'esm',
        },
    ],
    output: {
        target: 'web',
    },
    plugins: [pluginReact(), pluginSass()],
});
