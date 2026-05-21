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
    Check as CheckIcon,
    Language as LanguageIcon,
} from "@mui/icons-material";
import {Divider, ListSubheader, MenuItem} from "@mui/material";
import {Changelog, Layout, NavMenu, Loading} from "@microprojects/edm-components/components";
import {Home} from "./components/home/Home";
import {ApiContext} from './ApiContext';
import {roleAttr} from './styles/role';
import api from "./components/api";
import {resolveError} from "./i18n/resolveError";
import applogo from './assets/applogo.svg';
import {ToastProvider} from "@microprojects/edm-components/components";
import {AuthInterstitial} from "@microprojects/edm-components/components";
import {displayUserName} from "@microprojects/edm-components/utils";
import {UiPreferencesProvider, useUiPreferences, densityClass} from "@microprojects/edm-components/styles";

import {getUserFromToken} from "@microprojects/edm-components/hooks";
import {useDispatch, useSelector} from "react-redux";
import {useTranslation} from "react-i18next";
import {setUser} from "./slices/userSlice";
import type {RootState} from "@edm/store.ts";
import {appRoles} from './ApiContext';

const LANGUAGES = [
    {code: 'en', label: 'English'},
    {code: 'ru', label: 'Русский'},
] as const;

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
    const {t, i18n} = useTranslation('tech');
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

    const activeLng = LANGUAGES.find((l) => l.code === i18n.language)?.code
        ?? LANGUAGES.find((l) => i18n.language?.startsWith(l.code.split('-')[0]))?.code
        ?? 'en';

    const languageMenuItems = (
        <>
            <Divider />
            <ListSubheader sx={{
                fontFamily: 'var(--font-mono)', fontSize: 10.5, lineHeight: '24px',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                color: 'var(--ink-4)', background: 'transparent', pl: 2,
            }}>
                {t('common:language')}
            </ListSubheader>
            {LANGUAGES.map(({code, label}) => (
                <MenuItem
                    key={code}
                    selected={code === activeLng}
                    onClick={() => i18n.changeLanguage(code)}
                    sx={{ pr: 2 }}
                >
                    <LanguageIcon fontSize="small" sx={{ mr: 1.5, color: 'var(--ink-3)' }} />
                    <span style={{ flex: 1 }}>{label}</span>
                    {code === activeLng && (
                        <CheckIcon fontSize="small" sx={{ color: 'var(--accent)' }} />
                    )}
                </MenuItem>
            ))}
        </>
    );

    const navMenu = (
        <NavMenu
            hubUrl={`${api.baseUrl}/hub`}
            pluginName="Technologies"
            logoSrc={applogo}
            user={userState as any}
            roles={roleDescriptors}
            setRole={setRole}
            navItems={navItems}
            onLogout={() => {}}
            extraUserMenuItems={languageMenuItems}
        />
    );

    return (
        <div
            className={`page-root ${densityClass(density)}`}
            data-role={roleAttr(userRole)}
            data-scheme={scheme}
            data-plugin="technologies"
        >
            <Suspense fallback={<Loading/>}>
                <Routes>
                    <Route path="/operations/:id/*" element={<OperationLayout/>}/>
                    <Route element={
                        <Layout
                            navMenu={navMenu}
                            versionsApiUrl={`${api.meta}/version`}
                            versionChipName="Technologies"
                            versionChipVersionKey="main"
                            copyrightOwner="Microprojects"
                            copyrightStartYear={2020}
                        >
                            <Outlet/>
                        </Layout>
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
        </div>
    );
}
