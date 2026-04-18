import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import store from './store'
import 'bootstrap/dist/css/bootstrap.css'
import '@progress/kendo-theme-bootstrap/dist/all.css'

const base = import.meta.env.ASSET_PREFIX
const rootEl = document.getElementById('root')
if (rootEl) {
    const root = createRoot(rootEl)
    root.render(
        <Provider store={store}>
            <React.StrictMode>
                <BrowserRouter basename={base}>
                    <App />
                </BrowserRouter>
            </React.StrictMode>
        </Provider>,
    )
}
