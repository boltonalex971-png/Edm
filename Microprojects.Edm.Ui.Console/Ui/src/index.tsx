import { CssBaseline, ThemeProvider } from '@mui/material'
import { UiPreferencesProvider } from '@microprojects/edm-components/styles/UiPreferencesContext'
import { defaultTheme } from '@microprojects/edm-components/styles/theme'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// Side-effect import — initializes i18next + LanguageDetector synchronously
// before React mounts so the first paint is in the persisted locale.
import './i18n/i18n'
import App from './App'
import '@microprojects/edm-components/styles/tokens.css'
import '@microprojects/edm-components/styles/chrome.css'
import './app.css'

const base = import.meta.env.ASSET_PREFIX
const rootEl = document.getElementById('root')
if (rootEl) {
    const root = createRoot(rootEl)
    root.render(
        <React.StrictMode>
            <ThemeProvider theme={defaultTheme}>
                <CssBaseline />
                <UiPreferencesProvider storageKeyPrefix="console.">
                    <BrowserRouter basename={base}>
                        <App />
                    </BrowserRouter>
                </UiPreferencesProvider>
            </ThemeProvider>
        </React.StrictMode>,
    )
}
