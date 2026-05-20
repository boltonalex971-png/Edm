import { CssBaseline, ThemeProvider } from '@mui/material'
import { UiPreferencesProvider } from '@microprojects/edm-components/styles/UiPreferencesContext'
import { defaultTheme } from '@microprojects/edm-components/styles/theme'
import axios from 'axios'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// Side-effect import — initializes i18next + LanguageDetector synchronously
// before React mounts so the first paint is in the persisted locale.
import i18n from './i18n/i18n'
import App from './App'
import '@microprojects/edm-components/styles/tokens.css'
import '@microprojects/edm-components/styles/chrome.css'

// Stamp Accept-Language on every outgoing API call so the server's
// UseRequestLocalization picks the right culture for ABOUT/CHANGES lookup
// and error-code resolution.
axios.interceptors.request.use((config) => {
    config.headers.set('Accept-Language', i18n.language)
    return config
})

const rootEl = document.getElementById('root')
if (rootEl) {
    const root = createRoot(rootEl)
    root.render(
        <React.StrictMode>
            <ThemeProvider theme={defaultTheme}>
                <CssBaseline />
                <UiPreferencesProvider storageKeyPrefix="hub.">
                    <BrowserRouter>
                        <App />
                    </BrowserRouter>
                </UiPreferencesProvider>
            </ThemeProvider>
        </React.StrictMode>,
    )
}
