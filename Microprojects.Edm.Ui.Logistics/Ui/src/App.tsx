import './App.css'
import { Home } from '@logistics/components/homepages/Home.tsx'
import api from '@logistics/features/api/api'
import { useAlertSetter } from '@logistics/hooks/useAlertSetter'
import { resolveError } from '@logistics/i18n/resolveError'
import type { RootState } from '@logistics/store.ts'
import {
    AutorenewOutlined as RepackingIcon,
    HomeOutlined as HomeIcon,
    Inventory2Outlined as ItemsIcon,
    ListAltOutlined as OrdersIcon,
    LocalShippingOutlined as SuppliesIcon,
    SettingsOutlined as SettingsIcon,
    AdminPanelSettingsOutlined as AdminIcon,
    EngineeringOutlined as TechnologistIcon,
    PersonOutline as OperatorIcon,
} from '@mui/icons-material'
import { AppShell } from '@microprojects/edm-components/components/chrome/AppShell'
import { Changelog } from '@microprojects/edm-components/components/chrome/Changelog'
import { Loading } from '@microprojects/edm-components/components'
import axios from 'axios'
import React, { Suspense, lazy, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Route, Routes } from 'react-router-dom'
import { getUserFromToken } from './features/auth/authUtils'
import { setUser } from './features/auth/userSlice'
import logo from '../public/applogo.svg'

// Route-level code splitting — first paint loads only the shell + Home;
// each feature area is fetched on demand. Home stays eager because it
// IS the first paint after sign-in.
const Config = lazy(() =>
    import('@logistics/components/config/Config.tsx').then((m) => ({ default: m.Config })),
)
const OperatorDesktop = lazy(() =>
    import('@logistics/components/desktop/OperatorDesktop').then((m) => ({
        default: m.OperatorDesktop,
    })),
)
const Items = lazy(() =>
    import('@logistics/components/items/Items.tsx').then((m) => ({ default: m.Items })),
)
const Orders = lazy(() =>
    import('@logistics/components/orders/Orders.tsx').then((m) => ({ default: m.Orders })),
)
const Repacking = lazy(() =>
    import('@logistics/components/repacking/Repacking.tsx').then((m) => ({ default: m.Repacking })),
)
const Supplies = lazy(() =>
    import('@logistics/components/supplies/Supplies.tsx').then((m) => ({ default: m.Supplies })),
)

const ROLE_ICONS = {
    Admin: <AdminIcon fontSize="small" />,
    Technologist: <TechnologistIcon fontSize="small" />,
    Operator: <OperatorIcon fontSize="small" />,
}

type AppFrameProps = {
    children: React.ReactNode
    /** Hide the navigation menu items (keeps the brand and user/role block). */
    hideMenu?: boolean
}

function AppFrame({ children, hideMenu }: AppFrameProps) {
    const user = useSelector((s: RootState) => s.user)
    const { t } = useTranslation()
    const setAlert = useAlertSetter()

    const navItems = useMemo(
        () => [
            { id: 'home',      label: t('widgets:nav.home'),      path: '/',          icon: <HomeIcon fontSize="small" />,      exact: true },
            { id: 'orders',    label: t('widgets:nav.orders'),    path: '/orders',    icon: <OrdersIcon fontSize="small" /> },
            { id: 'supplies',  label: t('widgets:nav.supplies'),  path: '/supplies',  icon: <SuppliesIcon fontSize="small" /> },
            { id: 'items',     label: t('widgets:nav.items'),     path: '/items',     icon: <ItemsIcon fontSize="small" /> },
            { id: 'repacking', label: t('widgets:nav.repacking'), path: '/repacking', icon: <RepackingIcon fontSize="small" /> },
            { id: 'config',    label: t('widgets:nav.config'),    path: '/config',    icon: <SettingsIcon fontSize="small" /> },
        ],
        [t],
    )

    const roleDescriptors = useMemo(
        () => ({
            Admin:        { label: t('widgets:role.Admin'),        icon: ROLE_ICONS.Admin },
            Technologist: { label: t('widgets:role.Technologist'), icon: ROLE_ICONS.Technologist },
            Operator:     { label: t('widgets:role.Operator'),     icon: ROLE_ICONS.Operator },
        }),
        [t],
    )

    const setRole = (role: string) => {
        axios
            .put(`${api.auth}/user/role`, JSON.stringify(role), {
                headers: { 'Content-Type': 'application/json' },
            })
            .then(() => {
                // Hard-navigate to plugin root so the new role's auth cookie is picked up.
                const base = import.meta.env.ASSET_PREFIX || '/'
                const target = base.endsWith('/') ? base : `${base}/`
                window.location.assign(target)
            })
            .catch((err) =>
                setAlert({
                    status: 'danger',
                    message: resolveError(err, t('common:error')),
                }),
            )
    }

    return (
        <AppShell
            pluginName="Logistics"
            pluginAttr="logistics"
            logoSrc={logo}
            hubUrl={`${api.baseUrl}/hub`}
            versionsApiUrl={`${api.meta}/version`}
            versionChipName="Logistics"
            versionChipVersionKey="main"
            copyrightOwner="Microprojects"
            copyrightStartYear={2020}
            user={user}
            roles={roleDescriptors}
            setRole={setRole}
            navItems={navItems}
            hideMenu={hideMenu}
            languageLabelKey="language"
        >
            {children}
        </AppShell>
    )
}

export function App() {
    const { t } = useTranslation()
    const user = useSelector((state: RootState) => state.user)
    const userDispatch = useDispatch()

    useEffect(() => {
        const u = getUserFromToken()
        if (u) {
            userDispatch(setUser(u))
            return
        }
        // No cookie yet — happens when the SPA is served from a separate
        // origin (rsbuild dev) so the initial HTML load never hit the API.
        // Fetch user info; the response triggers the Negotiate handshake
        // and the server middleware seeds X-Auth-Token for later calls.
        axios
            .get(`${api.auth}/user/name`)
            .then((res) => {
                const info = res.data
                if (!info?.Name) return
                userDispatch(
                    setUser({
                        name: info.Name,
                        role: info.Role,
                        roles: info.Roles,
                        divisions: info.Divisions,
                        groups: info.Groups,
                    }),
                )
            })
            .catch(() => {
                /* leave Guest state if Negotiate fails */
            })
    }, [userDispatch])

    const isAuthenticated = user.name !== 'Guest'
    const hasRole = !!user.role && user.role !== 'Guest'
    const isOperator = user.role === 'Operator'

    if (isOperator) {
        // Operators get the standard Logistics shell with header + footer but
        // without the navigation menu — the desktop IS their home page, so it
        // is mounted directly at the plugin root rather than under /desktop.
        return (
            <AppFrame hideMenu>
                <Suspense fallback={<Loading />}>
                    <Routes>
                        <Route path="/changes" element={<Changelog changelogUrl={`${api.meta}/changelog`} />} />
                        <Route path="/*" element={<OperatorDesktop />} />
                    </Routes>
                </Suspense>
            </AppFrame>
        )
    }

    return (
        <AppFrame>
            {hasRole && (
                <Suspense fallback={<Loading />}>
                    <Routes>
                        <Route index element={<Home />} />
                        <Route path="/config/*" element={<Config />} />
                        <Route path="/orders/*" element={<Orders />} />
                        <Route path="/supplies/*" element={<Supplies />} />
                        <Route path="/items/*" element={<Items />} />
                        <Route path="/repacking" element={<Repacking />} />
                        <Route path="/changes" element={<Changelog changelogUrl={`${api.meta}/changelog`} />} />
                        <Route path="*" element={<span>{t('widgets:routes.notFound')}</span>} />
                    </Routes>
                </Suspense>
            )}
            {isAuthenticated && !hasRole && (
                <span>{t('widgets:auth.noRole', { name: user.name })}</span>
            )}
            {!isAuthenticated && (
                <span>{t('widgets:auth.notAuthenticated')}</span>
            )}
        </AppFrame>
    )
}

export default App
