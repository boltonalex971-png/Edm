import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { pluginBasicSsl } from '@rsbuild/plugin-basic-ssl'
import * as fs from 'node:fs'
import * as path from 'node:path'

const certPath = path.resolve(__dirname, '../../.dev-certs/localhost.pem')
const keyPath  = path.resolve(__dirname, '../../.dev-certs/localhost-key.pem')
const httpsCfg = fs.existsSync(certPath) && fs.existsSync(keyPath)
    ? { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) }
    : undefined

// `@microprojects/tools` is junctioned in via `file:` and ships its own dev
// `node_modules/react`. Pin react/react-dom resolution to the Hub's copy so we
// don't end up with two React instances at runtime (which breaks hooks with
// "Cannot read properties of null (reading 'useRef')").
const reactDir    = path.resolve(__dirname, 'node_modules/react')
const reactDomDir = path.resolve(__dirname, 'node_modules/react-dom')

export default defineConfig({
    plugins: [
        pluginReact(),
        pluginBasicSsl(),
    ],
    dev: {
        assetPrefix: '/',
        liveReload: true,
        hmr: true,
    },
    output: {
        // Hub mounts at the URL root, so its built assets are also served from /.
        assetPrefix: '/',
    },
    resolve: {
        alias: {
            react: reactDir,
            'react-dom': reactDomDir,
        },
    },
    html: {
        title: 'EDM Hub',
        favicon: './public/favicon.ico',
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
