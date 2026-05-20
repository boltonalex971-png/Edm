import './App.css'
import { Home } from '@logistics/components/homepages/Home.tsx'
import type { RootState } from '@logistics/store.ts'
import { Loading } from '@microprojects/edm-components/components'
import axios from 'axios'
import React, { Suspense, lazy, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import api from './features/api/api'
import { getUserFromToken } from './features/auth/authUtils'
import { setUser } from './features/auth/userSlice'

// Route-level code splitting — first paint loads only the shell + Home;
// each feature area is fetched on demand. Home stays eager because it
// IS the first paint after sign-in.
const Changelog = lazy(() =>
    import('@logistics/components/Changelog.tsx').then((m) => ({ default: m.Changelog })),
)
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
            <Layout hideMenu>
                <Suspense fallback={<Loading />}>
                    <Routes>
                        <Route path="/changes" element={<Changelog />} />
                        <Route path="/*" element={<OperatorDesktop />} />
                    </Routes>
                </Suspense>
            </Layout>
        )
    }

    return (
        <Layout>
            {hasRole && (
                <Suspense fallback={<Loading />}>
                    <Routes>
                        <Route index element={<Home />} />
                        <Route path="/config/*" element={<Config />} />
                        <Route path="/orders/*" element={<Orders />} />
                        <Route path="/supplies/*" element={<Supplies />} />
                        <Route path="/items/*" element={<Items />} />
                        <Route path="/repacking" element={<Repacking />} />
                        <Route path="/changes" element={<Changelog />} />
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
        </Layout>
    )
}

export default App
