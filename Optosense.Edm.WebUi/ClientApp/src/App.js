import React, { Component } from "react";
import { Route, MemoryRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./components/home/Home";
import { Dashboard } from "./components/dashboard/Dashboard";
import { Config } from "./components/config/Config";

import "./custom.css";
import '@progress/kendo-react-animation';
import '@progress/kendo-theme-bootstrap/dist/all.css';
import { NewOperationWizard } from "./components/operation/NewOperationWizard";
import { Plugins } from "./components/plugins/Plugins";

export default class App extends Component {

    render() {
        return (
            <Layout>
                <Route exact path="/" component={Home} />
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/config" component={Config} />
                <Route path="/Plugins" component={Plugins} />
                <Route path="/operation">
                    <MemoryRouter>
                        <NewOperationWizard />
                    </MemoryRouter>
                </Route>
            </Layout>
        );
    }
}
