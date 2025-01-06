import 'bootstrap/dist/css/bootstrap.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { ApiContext } from './ApiContext';
import App from './App';
//import registerServiceWorker from './registerServiceWorker';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './store'

const base = document.getElementsByTagName("base")[0].getAttribute("href");
const container = document.getElementById('app');
const root = createRoot(container);
root.render(
    <Provider store={store}>
        <BrowserRouter basename={base}>
            <App />
        </BrowserRouter>
    </Provider>
)

//registerServiceWorker();

