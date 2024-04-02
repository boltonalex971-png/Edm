import React, { useState } from "react";
import { Route, MemoryRouter, Switch } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./components/home/Home";
import { Dashboard } from "./components/dashboard/Dashboard";
import { Config } from "./components/config/Config";
import "./custom.css";
import '@progress/kendo-react-animation';
import '@progress/kendo-theme-bootstrap/dist/all.css';
import { NewOperationWizard } from "./components/operation/NewOperationWizard";
import { Plugins } from "./components/plugins/Plugins";
import { ApiContext, appRoles, UserContext } from './ApiContext';
import api from "./components/api";
import { useGet } from "./components/hooks/hooks";
import Operations from "./components/dashboard/Operations";
import { OperationLayout } from "./components/operation/OperationLayout";

export default function App() {
    const [homebase] = useState(`${process.env.REACT_APP_API_URL || window.location.origin}`);
    const [[userInfo, setUserInfo]] = useGet(`${api.auth}/user/name`, []);
    const setRole = (role) => setUserInfo({ ...userInfo, role: role });
    if (userInfo) {
        userInfo.setRole = setRole;
    }
    return (
        <ApiContext.Provider value={homebase}>
            <UserContext.Provider value={userInfo}>
                <Switch>
                    <Route path='/operations/:id' component={OperationLayout} />
                    <Layout>
                        <UserContext.Consumer>
                            {user =>
                                (user && user.role && user.role !== appRoles.operator &&
                                    <>
                                        <Route exact path="/" component={Home} />
                                        <Route path="/dashboard" component={Dashboard} />
                                        <Route path="/config" component={Config} />
                                        <Route path="/plugins" component={Plugins} />
                                        <Route path="/operation">
                                            <MemoryRouter>
                                                <NewOperationWizard />
                                            </MemoryRouter>
                                        </Route>
                                    </>) ||
                                (user && user.role === appRoles.operator && <Operations />) ||
                                (user && !user.role &&
                                    <span>
                                        As user {user.name} you are not authorized to access ISTP application.
                                        No role is assigned to your account.
                                        Please refer to your system administrator.
                                    </span>) ||
                                (!user &&
                                    <span>
                                        You are not authenticated to access ISTP application.
                                        Please refer to your system administrator.
                                    </span>)
                            }
                        </UserContext.Consumer>
                    </Layout>
                </Switch>
            </UserContext.Provider>
        </ApiContext.Provider>
    );
}
