import './App.css'
import { Config } from '@logistics/components/config/Config.tsx'
import { Home } from '@logistics/components/homepages/Home.tsx'
import { Items } from '@logistics/components/items/Items.tsx'
import { AllocateProcessOutput } from '@logistics/components/orders/AllocateProcessOutput.tsx'
import { Orders } from '@logistics/components/orders/Orders.tsx'
import { Repacking } from '@logistics/components/repacking/Repacking.tsx'
import { Supplies } from '@logistics/components/supplies/Supplies.tsx'
import type { RootState } from '@logistics/store.ts'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Processes } from './components/config/process/Processes'
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

    return (
        <Layout>
            {hasRole && (
                <Routes>
                    <Route index element={<Home />} />
                    <Route path="/config/*" element={<Config />} />
                    <Route
                        path="/orders/allocate-output/:orderId"
                        element={<AllocateProcessOutput />}
                    />
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
