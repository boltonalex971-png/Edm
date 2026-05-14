import { Layout as PkgLayout } from '@microprojects/edm-components/components/chrome/Layout'
import {
    NavMenu,
    type NavMenuUser,
} from '@microprojects/edm-components/components/chrome/NavMenu'
import {
    densityClass,
    useUiPreferences,
} from '@microprojects/edm-components/styles/UiPreferencesContext'
import logo from '../../public/applogo.svg'

interface ConsoleLayoutProps {
    user: NavMenuUser | null
    children: React.ReactNode
}

export function ConsoleLayout({ user, children }: ConsoleLayoutProps) {
    const { density, scheme } = useUiPreferences()

    const navMenu = (
        <NavMenu
            hubUrl="/hub"
            pluginName="Console"
            logoSrc={logo}
            homeHref="/"
            user={user ?? undefined}
            navItems={[]}
            showSearch={false}
        />
    )

    return (
        <div
            className={`page-root ${densityClass(density)}`}
            data-scheme={scheme}
            data-plugin="console"
        >
            <PkgLayout
                navMenu={navMenu}
                versionsApiUrl="/api/console/meta/version"
                versionChipName="Console"
                versionChipVersionKey="main"
                changelogPath="/changes"
                copyrightOwner="Microprojects"
                copyrightStartYear={2020}
            >
                {children}
            </PkgLayout>
        </div>
    )
}
