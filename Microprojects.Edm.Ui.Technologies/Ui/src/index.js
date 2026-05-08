import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { CssBaseline, ThemeProvider } from '@mui/material';
import App from './App.tsx';
import { store } from './store';
import { theme } from './theme';
import './tokens.css';
import './app.css';
import './custom.css';

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
