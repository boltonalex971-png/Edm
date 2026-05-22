import api from '@logistics/features/api/api'
import { resolveError } from '@logistics/i18n/resolveError'
import type { RootState } from '@logistics/store.ts'
import {
    AutorenewOutlined as RepackingIcon,
    Check as CheckIcon,
    HomeOutlined as HomeIcon,
    Inventory2Outlined as ItemsIcon,
    Language as LanguageIcon,
    ListAltOutlined as OrdersIcon,
    LocalShippingOutlined as SuppliesIcon,
    SettingsOutlined as SettingsIcon,
    AdminPanelSettingsOutlined as AdminIcon,
    EngineeringOutlined as TechnologistIcon,
    PersonOutline as OperatorIcon,
} from '@mui/icons-material'
import { Divider, ListSubheader, MenuItem } from '@mui/material'
import { Layout as PkgLayout } from '@microprojects/edm-components/components/chrome/Layout'
import { NavMenu } from '@microprojects/edm-components/components/chrome/NavMenu'
import {
    densityClass,
    useUiPreferences,
} from '@microprojects/edm-components/styles/UiPreferencesContext'
import axios from 'axios'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useAlertSetter } from '@logistics/hooks/useAlertSetter'
import logo from '../../public/applogo.svg'

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'ru', label: 'Русский' },
] as const

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
    const { density, scheme } = useUiPreferences()
    const { t, i18n } = useTranslation()
    const setAlert = useAlertSetter()
    const activeLng = LANGUAGES.find((l) => l.code === i18n.language)?.code
        ?? LANGUAGES.find((l) => i18n.language?.startsWith(l.code.split('-')[0]))?.code
        ?? 'en'

    const languageMenuItems = (
        <>
            <Divider />
            <ListSubheader sx={{
                fontFamily: 'var(--font-mono)', fontSize: 10.5, lineHeight: '24px',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                color: 'var(--ink-4)', background: 'transparent', pl: 2,
            }}>
                {t('language')}
            </ListSubheader>
            {LANGUAGES.map(({ code, label }) => (
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
    )

    const navItems = useMemo(() => {
        if (hideMenu) return []
        return [
            { id: 'home',      label: t('widgets:nav.home'),      path: '/',          icon: <HomeIcon fontSize="small" />,      exact: true },
            { id: 'orders',    label: t('widgets:nav.orders'),    path: '/orders',    icon: <OrdersIcon fontSize="small" /> },
            { id: 'supplies',  label: t('widgets:nav.supplies'),  path: '/supplies',  icon: <SuppliesIcon fontSize="small" /> },
            { id: 'items',     label: t('widgets:nav.items'),     path: '/items',     icon: <ItemsIcon fontSize="small" /> },
            { id: 'repacking', label: t('widgets:nav.repacking'), path: '/repacking', icon: <RepackingIcon fontSize="small" /> },
            { id: 'config',    label: t('widgets:nav.config'),    path: '/config',    icon: <SettingsIcon fontSize="small" /> },
        ]
    }, [hideMenu, t])

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

    const roleDescriptors = useMemo(
        () => ({
            Admin:        { label: t('widgets:role.Admin'),        icon: ROLE_ICONS.Admin },
            Technologist: { label: t('widgets:role.Technologist'), icon: ROLE_ICONS.Technologist },
            Operator:     { label: t('widgets:role.Operator'),     icon: ROLE_ICONS.Operator },
        }),
        [t],
    )

    const navMenu = (
        <NavMenu
            hubUrl={`${api.baseUrl}/hub`}
            pluginName="Logistics"
            logoSrc={logo}
            user={user as any}
            roles={roleDescriptors}
            setRole={setRole}
            navItems={navItems}
            extraUserMenuItems={languageMenuItems}
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
                versionChipName="Logistics"
                versionChipVersionKey="main"
                copyrightOwner="Microprojects"
                copyrightStartYear={2020}
            >
                {children}
            </PkgLayout>
        </div>
    )
}
