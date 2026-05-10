import React, {useCallback, useMemo} from "react";
import {Route, Switch} from "react-router";
import axios from "axios";
import {
    Business as BusinessIcon,
    Engineering as EngineeringIcon,
    PersonOutline as OperatorIcon,
    Home as HomeIcon,
    Dashboard as DashboardIcon,
    SettingsApplications as ConfigIcon,
    Extension as PluginsIcon,
} from "@mui/icons-material";
import {Changelog, Layout, NavMenu} from "@microprojects/edm-components/components";
import {Home} from "./components/home/Home";
import {Dashboard} from "./components/dashboard/Dashboard";
import {Config} from "./components/config/Config";
import {NewOperationWizard} from "./components/operation/NewOperationWizard";
import {Plugins} from "./components/plugins/Plugins";
import {ApiContext} from './ApiContext';
import {roleAttr} from './styles/role';
import api from "./components/api";
import applogo from './assets/applogo.svg';
import {ToastProvider} from "@microprojects/edm-components/components";
import {AuthInterstitial} from "@microprojects/edm-components/components";
import {displayUserName} from "@microprojects/edm-components/utils";
import {UiPreferencesProvider, useUiPreferences, densityClass} from "@microprojects/edm-components/styles";

import {getUserFromToken} from "@microprojects/edm-components/hooks";
import Operations from "./components/dashboard/Operations";
import {OperationLayout} from "./components/operation/OperationLayout";
import {useDispatch, useSelector} from "react-redux";
import {setUser} from "./slices/userSlice";
import type {RootState} from "@edm/store.ts";
import {appRoles} from './ApiContext';

const ROLE_DESCRIPTORS = {
    [appRoles.admin]:        { label: 'Administrator', icon: <BusinessIcon fontSize="small" /> },
    [appRoles.technologist]: { label: 'Technologist', icon: <EngineeringIcon fontSize="small" /> },
    [appRoles.operator]:     { label: 'Operator',     icon: <OperatorIcon fontSize="small" /> },
};

export default function App() {
    const apiBase = api.baseUrl;

    return (
        <ApiContext.Provider value={apiBase}>
            <UiPreferencesProvider>
                <ToastProvider>
                    <AppShell/>
                </ToastProvider>
            </UiPreferencesProvider>
        </ApiContext.Provider>
    );
}

function AppShell() {
    const userState = useSelector((state: RootState) => state.user);
    const userRole = userState.role;
    const user = userState.name;
    const userDispatch = useDispatch();
    const {density, scheme} = useUiPreferences();

    React.useEffect(() => {
        const u = getUserFromToken();
        if (u) {
            userDispatch(setUser(u));
        }
    }, [userDispatch]);

    const navItems = useMemo(() => {
        const items = [{ id: 'home', label: 'Home', path: '/', icon: <HomeIcon fontSize="small"/>, exact: true }];
        if (userRole === appRoles.operator) {
            items.push({ id: 'operations', label: 'Operations', path: '/dashboard/operations', icon: <ConfigIcon fontSize="small"/>, exact: false });
        } else if (userRole) {
            items.push({ id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon fontSize="small"/>, exact: false });
            items.push({ id: 'config',    label: 'Configuration', path: '/config', icon: <ConfigIcon fontSize="small"/>, exact: false });
            items.push({ id: 'plugins',   label: 'Plugins', path: '/plugins', icon: <PluginsIcon fontSize="small"/>, exact: false });
        }
        return items;
    }, [userRole]);

    const setRole = useCallback((role: string) => {
        axios.put(`${api.auth}/user/role`, JSON.stringify(role), { headers: { 'Content-Type': 'application/json' } })
            .then(() => window.location.reload())
            .catch(r => alert(r.response?.data?.detail || r.message));
    }, []);

    const navMenu = (
        <NavMenu
            hubUrl={`${api.baseUrl}/hub`}
            pluginName="Technologies"
            logoSrc={applogo}
            user={userState as any}
            roles={ROLE_DESCRIPTORS}
            setRole={setRole}
            navItems={navItems}
            onLogout={() => {}}
        />
    );

    return (
        <div
            className={`page-root ${densityClass(density)}`}
            data-role={roleAttr(userRole)}
            data-scheme={scheme}
            data-plugin="technologies"
        >
            <Switch>
                <Route path='/operations/:id' component={OperationLayout}/>
                <Layout
                    navMenu={navMenu}
                    versionsApiUrl={`${api.meta}/version`}
                    copyrightOwner="Microprojects"
                    copyrightStartYear={2020}
                >
                    <Route path="/changes" render={() => <Changelog changelogUrl={`${api.meta}/changelog`}/>}/>
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
    );
}
