import React, {useState} from "react";
import {Route, MemoryRouter, Switch} from "react-router";
import {Layout} from "./components/Layout";
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
import {useGet} from "./components/hooks/hooks";
import Operations from "./components/dashboard/Operations";
import {OperationLayout} from "./components/operation/OperationLayout";
import {useDispatch, useSelector} from "react-redux";
import {changeRole, setUser} from "./slices/userSlice";

export default function App() {
    const userRole = useSelector(state => state.user.role)
    const user = useSelector(state => state.user.name)
    const userDispatch = useDispatch()
    const [homebase] = useState(`${process.env.REACT_APP_API_URL || window.location.origin}`);
    const _ = useGet(`${api.auth}/user/name`, [], (u) => {
        userDispatch(setUser(u))
    })

    return (
            <ApiContext.Provider value={homebase}>
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
