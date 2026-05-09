import React from "react";
import {Route, Switch} from "react-router";
import {Layout} from "./components/Layout.js";
import {Changelog} from "./components/Changelog";
import {Home} from "./components/home/Home";
import {Dashboard} from "./components/dashboard/Dashboard";
import {Config} from "./components/config/Config";
import {NewOperationWizard} from "./components/operation/NewOperationWizard";
import {Plugins} from "./components/plugins/Plugins";
import {ApiContext} from './ApiContext';
import {roleAttr} from './styles/role';
import api from "./components/api";
import {ToastProvider} from "./components/states/Toast";
import {AuthInterstitial} from "./components/auth/AuthInterstitial";
import {displayUserName} from "./components/utils/userName";
import {readDensity, densityClass} from "./styles/density";
import {readScheme} from "./styles/scheme";

import {getUserFromToken} from "./components/hooks/hooks";
import Operations from "./components/dashboard/Operations";
import {OperationLayout} from "./components/operation/OperationLayout";
import {useDispatch, useSelector} from "react-redux";
import {setUser} from "./slices/userSlice";
import type {RootState} from "@edm/store.ts";
import {appRoles} from './ApiContext';

export default function App() {
    const userRole = useSelector((state: RootState) => state.user.role)
    const user = useSelector((state: RootState) => state.user.name)
    const userDispatch = useDispatch()
    const apiBase = api.baseUrl
    const density = React.useMemo(() => readDensity(), [])
    const scheme = React.useMemo(() => readScheme(), [])

    React.useEffect(() => {
        const u = getUserFromToken();
        if (u) {
            userDispatch(setUser(u));
        }
    }, [userDispatch]);

    return (
        <ApiContext.Provider value={apiBase}>
            <ToastProvider>
            <div
                className={`page-root ${densityClass(density)}`}
                data-role={roleAttr(userRole)}
                data-scheme={scheme}
                data-plugin="technologies"
            >
                <Switch>
                    <Route path='/operations/:id' component={OperationLayout}/>
                    <Layout>
                        <Route path="/changes" component={Changelog}/>
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
                            <AuthInterstitial kind="no-role" user={displayUserName(user)}/>
                        }
                        {!user &&
                            <AuthInterstitial kind="signin"/>
                        }
                    </Layout>
                </Switch>
            </div>
            </ToastProvider>
        </ApiContext.Provider>
    );
}
