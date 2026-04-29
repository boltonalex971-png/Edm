import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { pluginSass } from '@rsbuild/plugin-sass'
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
        pluginSass({ sassLoaderOptions: { warnRuleAsWarning: false } }),
        pluginBasicSsl(),
    ],
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
