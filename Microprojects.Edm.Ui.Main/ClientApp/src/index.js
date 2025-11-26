import 'bootstrap/dist/css/bootstrap.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { ApiContext } from './ApiContext';
import App from './App.tsx';
//import registerServiceWorker from './registerServiceWorker';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import {store} from './store'

const base = import.meta.env.ASSET_PREFIX 
const container = document.getElementById('root');
const root = createRoot(container);
root.render(
    <Provider store={store}>
        <BrowserRouter basename={base}>
            <App />
        </BrowserRouter>
    </Provider>
)

//registerServiceWorker();

