import api from '@logistics/features/api/api'
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
import { Layout as PkgLayout } from '@microprojects/edm-components/components/chrome/Layout'
import { NavMenu } from '@microprojects/edm-components/components/chrome/NavMenu'
import {
    densityClass,
    useUiPreferences,
} from '@microprojects/edm-components/styles/UiPreferencesContext'
import axios from 'axios'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import logo from '../../public/applogo.svg'

const ROLE_DESCRIPTORS = {
    Admin: { label: 'Administrator', icon: <AdminIcon fontSize="small" /> },
    Technologist: {
        label: 'Technologist',
        icon: <TechnologistIcon fontSize="small" />,
    },
    Operator: { label: 'Operator', icon: <OperatorIcon fontSize="small" /> },
}

type LayoutProps = {
    children: React.ReactNode
    /** Hide the navigation menu items (keeps the brand and user/role block). */
    hideMenu?: boolean
}

export const Layout = ({ children, hideMenu }: LayoutProps) => {
    const user = useSelector((s: RootState) => s.user)
    const { density, scheme } = useUiPreferences()

    const navItems = useMemo(() => {
        if (hideMenu) return []
        return [
            { id: 'home', label: 'Home', path: '/', icon: <HomeIcon fontSize="small" />, exact: true },
            { id: 'orders', label: 'Orders', path: '/orders', icon: <OrdersIcon fontSize="small" /> },
            { id: 'supplies', label: 'Supplies', path: '/supplies', icon: <SuppliesIcon fontSize="small" /> },
            { id: 'items', label: 'Items', path: '/items', icon: <ItemsIcon fontSize="small" /> },
            { id: 'repacking', label: 'Repacking', path: '/repacking', icon: <RepackingIcon fontSize="small" /> },
            { id: 'config', label: 'Settings', path: '/config', icon: <SettingsIcon fontSize="small" /> },
        ]
    }, [hideMenu])

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
            .catch((err) => alert(err.response?.data?.detail || err.message))
    }

    const navMenu = (
        <NavMenu
            hubUrl={`${api.baseUrl}/hub`}
            pluginName="Logistics"
            logoSrc={logo}
            user={user as any}
            roles={ROLE_DESCRIPTORS}
            setRole={setRole}
            navItems={navItems}
        />
    )

    return (
        <div
            className={`page-root ${densityClass(density)}`}
            data-scheme={scheme}
            data-plugin="logistics"
        >
            <PkgLayout
                navMenu={navMenu}
                versionsApiUrl={`${api.meta}/version`}
                copyrightOwner="Microprojects"
                copyrightStartYear={2020}
            >
                {children}
            </PkgLayout>
        </div>
    )
}
