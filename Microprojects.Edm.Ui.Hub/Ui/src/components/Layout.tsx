import { Layout as PkgLayout } from '@microprojects/edm-components/components/chrome/Layout'
import {
    NavMenu,
    type NavMenuUser,
} from '@microprojects/edm-components/components/chrome/NavMenu'
import {
    densityClass,
    useUiPreferences,
} from '@microprojects/edm-components/styles/UiPreferencesContext'
import {
    Check as CheckIcon,
    Language as LanguageIcon,
} from '@mui/icons-material'
import { Divider, ListSubheader, MenuItem } from '@mui/material'
import { useTranslation } from 'react-i18next'
import logo from '../../public/applogo.svg'

interface HubLayoutProps {
    user: NavMenuUser
    children: React.ReactNode
}

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'ru', label: 'Русский' },
] as const

export function HubLayout({ user, children }: HubLayoutProps) {
    const { density, scheme } = useUiPreferences()
    const { t, i18n } = useTranslation()
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

    const navMenu = (
        <NavMenu
            hubUrl="/hub"
            pluginName="Hub"
            logoSrc={logo}
            user={user}
            navItems={[]}
            showSearch={false}
            extraUserMenuItems={languageMenuItems}
        />
    )

    return (
        <div
            className={`page-root ${densityClass(density)}`}
            data-scheme={scheme}
            data-plugin="hub"
        >
            <PkgLayout
                navMenu={navMenu}
                versionsApiUrl="/api/hub/meta/version"
                changelogPath="/changes"
                copyrightOwner="Microprojects"
                copyrightStartYear={2020}
            >
                {children}
            </PkgLayout>
        </div>
    )
}
