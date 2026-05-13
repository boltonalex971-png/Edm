import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { pluginBasicSsl } from '@rsbuild/plugin-basic-ssl'
import { edmFontTag } from '@microprojects/edm-components/styles/fonts'
import * as fs from 'node:fs'
import * as path from 'node:path'

const certPath = path.resolve(__dirname, '../../.dev-certs/localhost.pem')
const keyPath  = path.resolve(__dirname, '../../.dev-certs/localhost-key.pem')
const httpsCfg = fs.existsSync(certPath) && fs.existsSync(keyPath)
    ? { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) }
    : undefined

// `@microprojects/*` packages are junctioned in via `file:` and ship their
// own dev `node_modules`. Pin every context-bearing library to Hub's copy so
// we don't end up with two React/MUI/Emotion/Router instances at runtime
// (breaks hooks / theme context / router context). Same pattern as Logistics.
const reactDir          = path.resolve(__dirname, 'node_modules/react')
const reactDomDir       = path.resolve(__dirname, 'node_modules/react-dom')
const muiDir            = path.resolve(__dirname, 'node_modules/@mui/material')
const muiIconsDir       = path.resolve(__dirname, 'node_modules/@mui/icons-material')
const muiSystemDir      = path.resolve(__dirname, 'node_modules/@mui/system')
const muiUtilsDir       = path.resolve(__dirname, 'node_modules/@mui/utils')
const muiPrivateDir     = path.resolve(__dirname, 'node_modules/@mui/private-theming')
const muiStyledEngineDir= path.resolve(__dirname, 'node_modules/@mui/styled-engine')
const emotionReactDir   = path.resolve(__dirname, 'node_modules/@emotion/react')
const emotionStyledDir  = path.resolve(__dirname, 'node_modules/@emotion/styled')
const reactRouterDomDir = path.resolve(__dirname, 'node_modules/react-router-dom')

export default defineConfig({
    plugins: [
        pluginReact(),
        pluginBasicSsl(),
    ],
    resolve: {
        alias: {
            react:                  reactDir,
            'react-dom':            reactDomDir,
            '@mui/material':        muiDir,
            '@mui/icons-material':  muiIconsDir,
            '@mui/system':          muiSystemDir,
            '@mui/utils':           muiUtilsDir,
            '@mui/private-theming': muiPrivateDir,
            '@mui/styled-engine':   muiStyledEngineDir,
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
        // Hub mounts at the URL root, so its built assets are also served from /.
        assetPrefix: '/',
    },
    html: {
        title: 'EDM Hub',
        favicon: './public/favicon.ico',
        tags: [edmFontTag],
    },
    server: {
        port: 3050,
        ...(httpsCfg ? { https: httpsCfg } : {}),
        proxy: {
            '/api':      { target: 'https://localhost:16332', secure: false, changeOrigin: false, ws: true },
            '/intercom': { target: 'https://localhost:16332', secure: false, changeOrigin: false, ws: true },
            '/hub':      { target: 'https://localhost:16332', secure: false, changeOrigin: false, ws: true },
        },
    },
})
