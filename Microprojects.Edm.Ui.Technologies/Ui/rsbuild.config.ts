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

// `@microprojects/edm-components` is junctioned in via `file:` and ships its
// own dev `node_modules`. Pin react/react-dom + MUI + Emotion resolution to
// the Tech copy so we don't end up with two React/MUI/Emotion instances at
// runtime (which breaks hooks / theme context). Same pattern as the Hub plugin.
const reactDir          = path.resolve(__dirname, 'node_modules/react')
const reactDomDir       = path.resolve(__dirname, 'node_modules/react-dom')
const muiDir            = path.resolve(__dirname, 'node_modules/@mui/material')
const muiIconsDir       = path.resolve(__dirname, 'node_modules/@mui/icons-material')
const muiTreeViewDir    = path.resolve(__dirname, 'node_modules/@mui/x-tree-view')
const muiDataGridDir    = path.resolve(__dirname, 'node_modules/@mui/x-data-grid')
const muiSystemDir      = path.resolve(__dirname, 'node_modules/@mui/system')
const muiUtilsDir       = path.resolve(__dirname, 'node_modules/@mui/utils')
const muiPrivateDir     = path.resolve(__dirname, 'node_modules/@mui/private-theming')
const muiStyledEngineDir= path.resolve(__dirname, 'node_modules/@mui/styled-engine')
const muiXInternalsDir  = path.resolve(__dirname, 'node_modules/@mui/x-internals')
const muiXVirtualizerDir= path.resolve(__dirname, 'node_modules/@mui/x-virtualizer')
const emotionReactDir   = path.resolve(__dirname, 'node_modules/@emotion/react')
const emotionStyledDir  = path.resolve(__dirname, 'node_modules/@emotion/styled')
const reactRouterDomDir = path.resolve(__dirname, 'node_modules/react-router-dom')
const reactRouterDir    = path.resolve(__dirname, 'node_modules/react-router')
const historyDir        = path.resolve(__dirname, 'node_modules/history')

export default defineConfig({
  plugins: [
	pluginReact(),
	pluginEslint(),
        pluginSass(),
        pluginBasicSsl()
  ],
  resolve: {
    alias: {
        react:                 reactDir,
        'react-dom':           reactDomDir,
        '@mui/material':       muiDir,
        '@mui/icons-material': muiIconsDir,
        '@mui/x-tree-view':    muiTreeViewDir,
        '@mui/x-data-grid':    muiDataGridDir,
        '@mui/system':         muiSystemDir,
        '@mui/utils':          muiUtilsDir,
        '@mui/private-theming': muiPrivateDir,
        '@mui/styled-engine':  muiStyledEngineDir,
        '@mui/x-internals':    muiXInternalsDir,
        '@mui/x-virtualizer':  muiXVirtualizerDir,
        '@emotion/react':      emotionReactDir,
        '@emotion/styled':     emotionStyledDir,
        // Router is context-based too — a duplicate copy sees no <Router> ancestor
        // and `useLocation`/`useHistory` return undefined.
        'react-router-dom':    reactRouterDomDir,
        'react-router':        reactRouterDir,
        history:               historyDir,
    },
  },
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

