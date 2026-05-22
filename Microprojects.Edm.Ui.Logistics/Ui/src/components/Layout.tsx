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
import axios from 'axios'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import logo from '../../public/applogo.svg'

const ROLE_ICONS = {
    Admin: <AdminIcon fontSize="small" />,
    Technologist: <TechnologistIcon fontSize="small" />,
    Operator: <OperatorIcon fontSize="small" />,
}

type LayoutProps = {
    children: React.ReactNode
    /** Hide the navigation menu items (keeps the brand and user/role block). */
    hideMenu?: boolean
}

export const Layout = ({ children, hideMenu }: LayoutProps) => {
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
