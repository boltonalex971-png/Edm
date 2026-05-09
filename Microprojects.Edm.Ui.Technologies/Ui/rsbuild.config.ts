import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginEslint } from '@rsbuild/plugin-eslint';
import { pluginSass } from "@rsbuild/plugin-sass";
import { pluginBasicSsl } from '@rsbuild/plugin-basic-ssl'
import * as fs from 'node:fs'
import * as path from 'node:path'

const certPath = path.resolve(__dirname, '../../.dev-certs/localhost.pem')
const keyPath  = path.resolve(__dirname, '../../.dev-certs/localhost-key.pem')
const httpsCfg = fs.existsSync(certPath) && fs.existsSync(keyPath)
    ? { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) }
    : undefined

export default defineConfig({
  plugins: [
	pluginReact(),
	pluginEslint(),
        pluginSass(),
        pluginBasicSsl()
  ],
  html: {
    title: 'Edm Technologies',
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
        port: 3010,
        ...(httpsCfg ? { https: httpsCfg } : {}),
        proxy: {
            '/api':      { target: 'https://localhost:16332', secure: false, changeOrigin: false, ws: true },
            '/intercom': { target: 'https://localhost:16332', secure: false, changeOrigin: false, ws: true },
            '/hub':      { target: 'https://localhost:16332', secure: false, changeOrigin: false, ws: true },
        },
    },
});

