import React from 'react'
import axios from 'axios'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
// Side-effect import — initializes i18next + LanguageDetector synchronously
// before React mounts so the first paint is in the persisted locale.
import i18n from './i18n/i18n'
import App from './App'
import { EntityRefreshProvider, setDefaultAcceptLanguage } from '@microprojects/edm-components/hooks'
import { EntityRefreshSignalRBridge } from './hooks/entityRefreshBridge'
import { LockProvider, type LockPublisher } from '@microprojects/edm-components/hooks'
import { getCurrentConnectionId, publishLogisticsMessage } from './hooks/signalRHooks'
import { events, parseEntityType } from './hooks/logisticsEvents'
// Use granular subpath imports to avoid pulling the package's RR5-bound
// chrome (Layout/NavMenu/TreeViewMaster) into Logistics's bundle —
// Logistics is on react-router-dom@7 and those modules wouldn't link.
import { CssBaseline, ThemeProvider } from '@mui/material'
import { ToastProvider } from '@microprojects/edm-components/components/states/Toast'
import { UiPreferencesProvider } from '@microprojects/edm-components/styles/UiPreferencesContext'
import { defaultTheme } from '@microprojects/edm-components/styles/theme'
import store from './store'
import '@microprojects/edm-components/styles/tokens.css'
import '@microprojects/edm-components/styles/chrome.css'
import './logistics-entities.css'

// Bridge Logistics's existing SignalR publisher to the package's lock
// store. Validates `type` via parseEntityType so a typo never escapes
// onto the wire as a phantom entity.
const lockPublisher: LockPublisher = {
    publishEntityLock: (type, id, username) => {
        const t = parseEntityType(type)
        if (!t) return
        publishLogisticsMessage(events.entityLocked(t, id, username))
    },
    publishEntityUnlock: (type, id, username) => {
        const t = parseEntityType(type)
        if (!t) return
        publishLogisticsMessage(events.entityUnlocked(t, id, username))
    },
    publishOrderClaim: (orderId, username) =>
        publishLogisticsMessage(events.orderClaimed(orderId, username)),
    publishOrderRelease: (orderId, username) =>
        publishLogisticsMessage(events.orderReleased(orderId, username)),
    getCurrentConnectionId,
}

// Register the Accept-Language getter so the package's useFetch/query helpers
// stamp the same locale as the axios interceptor below.
setDefaultAcceptLanguage(() => i18n.language)

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
    config.headers.set('Accept-Language', i18n.language)
    return config
})

const base = import.meta.env.ASSET_PREFIX
const rootEl = document.getElementById('root')
if (rootEl) {
    const root = createRoot(rootEl)
    root.render(
        <Provider store={store}>
            <React.StrictMode>
                <ThemeProvider theme={defaultTheme}>
                    <CssBaseline />
                    <UiPreferencesProvider storageKeyPrefix="logistics.">
                        <ToastProvider position="top-right">
                            <EntityRefreshProvider>
                                <LockProvider publisher={lockPublisher}>
                                    <EntityRefreshSignalRBridge />
                                    <BrowserRouter basename={base}>
                                        <App />
                                    </BrowserRouter>
                                </LockProvider>
                            </EntityRefreshProvider>
                        </ToastProvider>
                    </UiPreferencesProvider>
                </ThemeProvider>
            </React.StrictMode>
        </Provider>,
    )
}
