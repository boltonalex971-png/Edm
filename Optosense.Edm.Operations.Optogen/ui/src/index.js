import React from "react";
import { createRoot } from 'react-dom/client';
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import "@progress/kendo-theme-bootstrap/dist/all.css";
import { BrowserRouter } from "react-router-dom";

const base = document.getElementsByTagName("base")[0].getAttribute("href");
const container = document.getElementById('app');
const root = createRoot(container);
root.render(
    <BrowserRouter basename={base} >
        <App apiBase={process.env.REACT_APP_API_URL || window.location.origin} />
    </BrowserRouter>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
