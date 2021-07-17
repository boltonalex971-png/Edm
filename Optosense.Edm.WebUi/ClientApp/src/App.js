import React, { Component } from "react";
import { Route, MemoryRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./components/home/Home";
import { Dashboard } from "./components/dashboard/Dashboard";
import { Config } from "./components/config/Config";
import "./custom.css";
import '@progress/kendo-react-animation';
import '@progress/kendo-theme-bootstrap/dist/all.css';
import 'react-bootstrap-icons';
import { NewOperationWizard } from "./components/operation/NewOperationWizard";
import { Plugins } from "./components/plugins/Plugins";
import { ApiContext } from './ApiContext';

export default function App() {
    return (
        <ApiContext.Provider value={`${process.env.REACT_APP_API_URL || window.location.origin}`}>
            <Layout>
                <Route exact path="/" component={Home} />
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/config" component={Config} />
                <Route path="/plugins" component={Plugins} />
                <Route path="/operation">
                    <MemoryRouter>
                        <NewOperationWizard />
                    </MemoryRouter>
                </Route>
            </Layout>
        </ApiContext.Provider>
    );
}
