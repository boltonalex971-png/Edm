import { CssBaseline, ThemeProvider } from '@mui/material'
import { UiPreferencesProvider } from '@microprojects/edm-components/styles/UiPreferencesContext'
import { defaultTheme } from '@microprojects/edm-components/styles/theme'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import '@microprojects/edm-components/styles/tokens.css'
import '@microprojects/edm-components/styles/chrome.css'

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
