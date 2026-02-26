import React, {useState} from "react";
import {Route, MemoryRouter, Switch} from "react-router";
import {Layout} from "./components/Layout.js";
import {Home} from "./components/home/Home";
import {Dashboard} from "./components/dashboard/Dashboard";
import {Config} from "./components/config/Config";
import "./custom.css";
import '@progress/kendo-react-animation';
import '@progress/kendo-theme-bootstrap/dist/all.css';
import {NewOperationWizard} from "./components/operation/NewOperationWizard";
import {Plugins} from "./components/plugins/Plugins";
import {ApiContext, appRoles, UserContext} from './ApiContext';
import api from "./components/api";
import {getUserFromToken} from "./components/hooks/hooks";
import Operations from "./components/dashboard/Operations";
import {OperationLayout} from "./components/operation/OperationLayout";
import {useDispatch, useSelector} from "react-redux";
import {changeRole, setUser, type UserState} from "./slices/userSlice";
import type {RootState} from "@edm/store.ts";

export default function App() {
    const userRole = useSelector((state : RootState) => state.user.role)
    const user = useSelector((state : RootState) => state.user.name)
    const userDispatch = useDispatch()
    //const [homebase] = useState(`${import.meta.env.ASSET_PREFIX || window.location.origin}`);
    const apiBase = api.baseUrl

    React.useEffect(() => {
        const u = getUserFromToken();
        if (u) {
            userDispatch(setUser(u));
        }
    }, [userDispatch]);

    return (
            <ApiContext.Provider value={apiBase}>
                <Switch>
                    <Route path='/operations/:id' component={OperationLayout}/>
                    <Layout>
                        {user && userRole &&
                            <>
                                <Route exact path="/" component={Home}/>
                                {userRole === appRoles.operator &&
                                    <Route path="/dashboard/operations" component={Operations}/>}
                                {userRole !== appRoles.operator && <Route path="/dashboard" component={Dashboard}/>}
                                {userRole !== appRoles.operator && <Route path="/config" component={Config}/>}
                                {userRole !== appRoles.operator && <Route path="/plugins" component={Plugins}/>}
                                <Route path="/operation" component={NewOperationWizard}/>
                            </>
                        }
                        {user && !userRole &&
                            <span>
                            As user {user} you are not authorized to access ISTP application.
                            No role is assigned to your account.
                            Please refer to your system administrator.
                        </span>
                        }
                        {!user &&
                            <span>
                            You are not authenticated to access ISTP application.
                            Please refer to your system administrator.
                        </span>
                        }
                    </Layout>
                </Switch>
            </ApiContext.Provider>
    );
}
