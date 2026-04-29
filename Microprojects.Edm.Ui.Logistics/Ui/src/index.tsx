import React from 'react'
import axios from 'axios'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { EntityRefreshProvider } from './hooks/entityRefresh'
import { EntityRefreshSignalRBridge } from './hooks/entityRefreshBridge'
import { getCurrentConnectionId } from './hooks/signalRHooks'
import store from './store'
import 'bootstrap/dist/css/bootstrap.css'
import '@progress/kendo-theme-bootstrap/dist/all.css'

// Required so the X-Auth-Token cookie and Negotiate handshake travel on
// cross-origin XHR when the SPA is served from the rsbuild dev server
// (https://localhost:3000) and the API runs on https://localhost:16332.
axios.defaults.withCredentials = true

// Stamp the originator's hub connection id on every API request so the
// server can echo it back in published LogisticsMessages — the bridge uses
// it to suppress self-echo. Header is omitted before the hub connects,
// which the server treats as anonymous origin (no echo suppression).
axios.interceptors.request.use((config) => {
    const id = getCurrentConnectionId()
    if (id) {
        config.headers.set('X-Edm-Connection-Id', id)
    }
    return config
})

const base = import.meta.env.ASSET_PREFIX
const rootEl = document.getElementById('root')
if (rootEl) {
    const root = createRoot(rootEl)
    root.render(
        <Provider store={store}>
            <React.StrictMode>
                <EntityRefreshProvider>
                    <EntityRefreshSignalRBridge />
                    <BrowserRouter basename={base}>
                        <App />
                    </BrowserRouter>
                </EntityRefreshProvider>
            </React.StrictMode>
        </Provider>,
    )
}
