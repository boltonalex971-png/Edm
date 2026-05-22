import React, {Suspense, lazy, useCallback, useMemo} from "react";
import {Outlet, Route, Routes} from "react-router-dom";
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
import {Changelog, Loading} from "@microprojects/edm-components/components";
import {AppShell as PkgAppShell} from "@microprojects/edm-components/components/chrome/AppShell";
import {Home} from "./components/home/Home";
import {ApiContext} from './ApiContext';
import {roleAttr} from './styles/role';
import api from "./components/api";
import {resolveError} from "./i18n/resolveError";
import applogo from './assets/applogo.svg';
import {ToastProvider} from "@microprojects/edm-components/components";
import {AuthInterstitial} from "@microprojects/edm-components/components";
import {displayUserName} from "@microprojects/edm-components/utils";
import {UiPreferencesProvider} from "@microprojects/edm-components/styles";

import {getUserFromToken} from "@microprojects/edm-components/hooks";
import {useDispatch, useSelector} from "react-redux";
import {useTranslation} from "react-i18next";
import {setUser} from "./slices/userSlice";
import type {RootState} from "@edm/store.ts";
import {appRoles} from './ApiContext';

// Route-level code splitting — shell + Home eager; everything else fetched
// on demand so first paint isn't dragged down by the MUI X DataGrid chunk
// pulled in by Config/Dashboard.
const Dashboard = lazy(() => import("./components/dashboard/Dashboard").then(m => ({default: m.Dashboard})));
const Config = lazy(() => import("./components/config/Config").then(m => ({default: m.Config})));
const NewOperationWizard = lazy(() => import("./components/operation/NewOperationWizard").then(m => ({default: m.NewOperationWizard})));
const Plugins = lazy(() => import("./components/plugins/Plugins").then(m => ({default: m.Plugins})));
const Operations = lazy(() => import("./components/dashboard/Operations"));
const OperationLayout = lazy(() => import("./components/operation/OperationLayout").then(m => ({default: m.OperationLayout})));

function useRoleDescriptors() {
    const {t} = useTranslation('tech');
    return useMemo(() => ({
        [appRoles.admin]:        { label: t('roles.administrator'), icon: <BusinessIcon fontSize="small" /> },
        [appRoles.technologist]: { label: t('roles.technologist'),  icon: <EngineeringIcon fontSize="small" /> },
        [appRoles.operator]:     { label: t('roles.operator'),      icon: <OperatorIcon fontSize="small" /> },
    }), [t]);
}

export default function App() {
    const apiBase = api.baseUrl;

    return (
        <ApiContext.Provider value={apiBase}>
            <UiPreferencesProvider>
                <ToastProvider>
                    <AppFrame/>
                </ToastProvider>
            </UiPreferencesProvider>
        </ApiContext.Provider>
    );
}

function AppFrame() {
    const userState = useSelector((state: RootState) => state.user);
    const userRole = userState.role;
    const user = userState.name;
    const userDispatch = useDispatch();
    const {t} = useTranslation('tech');
    const roleDescriptors = useRoleDescriptors();

    React.useEffect(() => {
        const u = getUserFromToken();
        if (u) {
            userDispatch(setUser(u));
        }
    }, [userDispatch]);

    const navItems = useMemo(() => {
        const items = [{ id: 'home', label: t('nav.home'), path: '/', icon: <HomeIcon fontSize="small"/>, exact: true }];
        if (userRole === appRoles.operator) {
            items.push({ id: 'operations', label: t('nav.operations'), path: '/dashboard/operations', icon: <ConfigIcon fontSize="small"/>, exact: false });
        } else if (userRole) {
            items.push({ id: 'dashboard', label: t('nav.dashboard'), path: '/dashboard', icon: <DashboardIcon fontSize="small"/>, exact: false });
            items.push({ id: 'config',    label: t('nav.configuration'), path: '/config', icon: <ConfigIcon fontSize="small"/>, exact: false });
            items.push({ id: 'plugins',   label: t('nav.plugins'), path: '/plugins', icon: <PluginsIcon fontSize="small"/>, exact: false });
        }
        return items;
    }, [userRole, t]);

    const setRole = useCallback((role: string) => {
        axios.put(`${api.auth}/user/role`, JSON.stringify(role), { headers: { 'Content-Type': 'application/json' } })
            .then(() => window.location.reload())
            .catch(r => alert(resolveError(r, t('common:error'))));
    }, [t]);

    return (
        <Suspense fallback={<Loading/>}>
            <Routes>
                <Route path="/operations/:id/*" element={<OperationLayout/>}/>
                <Route element={
                    <PkgAppShell
                        pluginName="Technologies"
                        pluginAttr="technologies"
                        logoSrc={applogo}
                        hubUrl={`${api.baseUrl}/hub`}
                        versionsApiUrl={`${api.meta}/version`}
                        versionChipName="Technologies"
                        versionChipVersionKey="main"
                        copyrightOwner="Microprojects"
                        copyrightStartYear={2020}
                        user={userState as any}
                        roles={roleDescriptors}
                        setRole={setRole}
                        navItems={navItems}
                        roleAttr={roleAttr(userRole)}
                    >
                        <Outlet/>
                    </PkgAppShell>
                }>
                    <Route path="changes" element={<Changelog changelogUrl={`${api.meta}/changelog`}/>}/>
                    {user && userRole && <>
                        <Route index element={<Home/>}/>
                        {userRole === appRoles.operator &&
                            <Route path="dashboard/operations/*" element={<Operations/>}/>}
                        {userRole !== appRoles.operator && <Route path="dashboard/*" element={<Dashboard/>}/>}
                        {userRole !== appRoles.operator && <Route path="config/*" element={<Config/>}/>}
                        {userRole !== appRoles.operator && <Route path="plugins/*" element={<Plugins/>}/>}
                        <Route path="operation/*" element={<NewOperationWizard/>}/>
                    </>}
                    {user && !userRole &&
                        <Route path="*" element={<AuthInterstitial kind="no-role" user={displayUserName(user)}/>}/>
                    }
                    {!user &&
                        <Route path="*" element={<AuthInterstitial kind="signin"/>}/>
                    }
                </Route>
            </Routes>
        </Suspense>
    );
}
