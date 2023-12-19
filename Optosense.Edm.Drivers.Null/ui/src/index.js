import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';

const base = document.getElementsByTagName("base")[0].getAttribute("href");

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter basename={base} >
      <App apiBase={process.env.REACT_APP_API_URL || window.location.origin} />
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);

