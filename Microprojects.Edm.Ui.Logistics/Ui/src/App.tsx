import './App.css'
import { Changelog } from '@logistics/components/Changelog.tsx'
import { Config } from '@logistics/components/config/Config.tsx'
import { OperatorDesktop } from '@logistics/components/desktop/OperatorDesktop'
import { Home } from '@logistics/components/homepages/Home.tsx'
import { Items } from '@logistics/components/items/Items.tsx'
import { Orders } from '@logistics/components/orders/Orders.tsx'
import { Repacking } from '@logistics/components/repacking/Repacking.tsx'
import { Supplies } from '@logistics/components/supplies/Supplies.tsx'
import type { RootState } from '@logistics/store.ts'
import axios from 'axios'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import api from './features/api/api'
import { getUserFromToken } from './features/auth/authUtils'
import { setUser } from './features/auth/userSlice'

export function App() {
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
                <Routes>
                    <Route path="/changes" element={<Changelog />} />
                    <Route path="/*" element={<OperatorDesktop />} />
                </Routes>
            </Layout>
        )
    }

    return (
        <Layout>
            {hasRole && (
                <Routes>
                    <Route index element={<Home />} />
                    <Route path="/config/*" element={<Config />} />
                    <Route path="/orders/*" element={<Orders />} />
                    <Route path="/supplies/*" element={<Supplies />} />
                    <Route path="/items/*" element={<Items />} />
                    <Route path="/repacking" element={<Repacking />} />
                    <Route path="/changes" element={<Changelog />} />
                    <Route path="*" element={<span>Page not exist</span>} />
                </Routes>
            )}
            {isAuthenticated && !hasRole && (
                <span>
                    As user {user.name} you are not authorized to access ISTP
                    application. No role is assigned to your account. Please
                    refer to your system administrator.
                </span>
            )}
            {!isAuthenticated && (
                <span>
                    You are not authenticated to access ISTP application. Please
                    refer to your system administrator.
                </span>
            )}
        </Layout>
    )
}

export default App
