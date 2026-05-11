import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { pluginSass } from '@rsbuild/plugin-sass'
import { pluginBasicSsl } from '@rsbuild/plugin-basic-ssl'
import { edmFontTag } from '@microprojects/edm-components/styles/fonts'
import * as fs from 'node:fs'
import * as path from 'node:path'

const certPath = path.resolve(__dirname, '../../.dev-certs/localhost.pem')
const keyPath  = path.resolve(__dirname, '../../.dev-certs/localhost-key.pem')
const httpsCfg = fs.existsSync(certPath) && fs.existsSync(keyPath)
    ? { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) }
    : undefined

// `@microprojects/edm-components` is junctioned in via `file:` and ships its
// own dev `node_modules`. Pin every context-bearing library to Logistics's
// copy so we don't end up with two React/MUI/Emotion/Router instances at
// runtime (breaks hooks / theme context / router context). Same pattern as Tech.
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
// Logistics is on react-router-dom@7 — `react-router` and `history` are
// bundled internally and not installed as separate packages. Aliases
// omitted for those; if a future Phase 3 swap needs them, install them
// first or downgrade to RR5.

export default defineConfig({
    plugins: [
        pluginReact(),
        pluginSass({ sassLoaderOptions: { warnRuleAsWarning: false } }),
        pluginBasicSsl(),
    ],
    resolve: {
        alias: {
            react:                  reactDir,
            'react-dom':            reactDomDir,
            '@mui/material':        muiDir,
            '@mui/icons-material':  muiIconsDir,
            '@mui/x-tree-view':     muiTreeViewDir,
            '@mui/x-data-grid':     muiDataGridDir,
            '@mui/system':          muiSystemDir,
            '@mui/utils':           muiUtilsDir,
            '@mui/private-theming': muiPrivateDir,
            '@mui/styled-engine':   muiStyledEngineDir,
            '@mui/x-internals':     muiXInternalsDir,
            '@mui/x-virtualizer':   muiXVirtualizerDir,
            '@emotion/react':       emotionReactDir,
            '@emotion/styled':      emotionStyledDir,
            'react-router-dom':     reactRouterDomDir,
        },
    },
    dev: {
        assetPrefix: '/',
        liveReload: true,
        hmr: true,
    },
    output: {
        assetPrefix: '/logistics',
    },
    html: {
        title: 'Edm Logistics',
        favicon: './public/favicon.ico',
        tags: [edmFontTag],
    },
    server: {
        port: 3000,
        ...(httpsCfg ? { https: httpsCfg } : {}),
        proxy: {
            '/api':      { target: 'https://localhost:16332', secure: false, changeOrigin: false, ws: true },
            '/intercom': { target: 'https://localhost:16332', secure: false, changeOrigin: false, ws: true },
            '/hub':      { target: 'https://localhost:16332', secure: false, changeOrigin: false, ws: true },
        },
    },
})
