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

interface HubLayoutProps {
    user: NavMenuUser
    children: React.ReactNode
}

export function HubLayout({ user, children }: HubLayoutProps) {
    const { density, scheme } = useUiPreferences()

    const navMenu = (
        <NavMenu
            hubUrl="/hub"
            pluginName="Hub"
            logoSrc={logo}
            user={user}
            navItems={[]}
            showSearch={false}
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
                showMainVersion={false}
            >
                {children}
            </PkgLayout>
        </div>
    )
}
