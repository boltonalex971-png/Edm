import './App.css'
import { Config } from '@logistics/components/config/Config.tsx'
import { OperatorDesktop } from '@logistics/components/desktop/OperatorDesktop'
import { Home } from '@logistics/components/homepages/Home.tsx'
import { Items } from '@logistics/components/items/Items.tsx'
import { Orders } from '@logistics/components/orders/Orders.tsx'
import { Repacking } from '@logistics/components/repacking/Repacking.tsx'
import { Supplies } from '@logistics/components/supplies/Supplies.tsx'
import type { RootState } from '@logistics/store.ts'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { getUserFromToken } from './features/auth/authUtils'
import { setUser } from './features/auth/userSlice'

export function App() {
    const user = useSelector((state: RootState) => state.user)
    const userDispatch = useDispatch()

    useEffect(() => {
        const u = getUserFromToken()
        if (u) {
            userDispatch(setUser(u))
        }
    }, [userDispatch])

    const isAuthenticated = user.name !== 'Guest'
    const hasRole = !!user.role && user.role !== 'Guest'
    const isOperator = user.role === 'Operator'

    if (isOperator) {
        // Operators get the standard Logistics shell with header + footer but
        // without the navigation menu (the desktop is the only surface they
        // can act on).
        return (
            <Layout hideMenu>
                <Routes>
                    <Route path="/desktop/*" element={<OperatorDesktop />} />
                    <Route
                        path="*"
                        element={<Navigate to="/desktop" replace />}
                    />
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
