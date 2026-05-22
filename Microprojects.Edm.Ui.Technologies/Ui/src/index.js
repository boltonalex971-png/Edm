import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { CssBaseline, ThemeProvider } from '@mui/material';
import axios from 'axios';
// Side-effect import — initializes i18next + LanguageDetector synchronously
// before React mounts so the first paint is in the persisted locale.
import i18n from './i18n/i18n';
import { setDefaultAcceptLanguage } from '@microprojects/edm-components/hooks';
import App from './App.tsx';
import { store } from './store';
import { theme } from './theme';
import './tokens.css';
import './app.css';
import './custom.css';

// Register the Accept-Language getter so the package's useFetch/query helpers
// stamp the same locale as the axios interceptor below.
setDefaultAcceptLanguage(() => i18n.language);

// Stamp Accept-Language on every outgoing API call so the server's
// UseRequestLocalization picks the right culture for ABOUT/CHANGES lookup
// and error-code resolution.
axios.interceptors.request.use((config) => {
    config.headers.set('Accept-Language', i18n.language);
    return config;
});

const base = import.meta.env.ASSET_PREFIX
const container = document.getElementById('root');
const root = createRoot(container);
root.render(
    <Provider store={store}>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter basename={base}>
                <App />
            </BrowserRouter>
        </ThemeProvider>
    </Provider>
)
