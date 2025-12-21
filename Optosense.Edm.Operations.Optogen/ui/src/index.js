import React from "react";
import { createRoot } from 'react-dom/client';
import "./index.css";
import App from "./App";
import "@progress/kendo-theme-bootstrap/dist/all.css";
import { BrowserRouter } from "react-router-dom";

const base = import.meta.env.ASSET_PREFIX 
const container = document.getElementById('root');
const root = createRoot(container);
root.render(
    <BrowserRouter basename={base} >
        <App />
    </BrowserRouter>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
//serviceWorker.unregister();
