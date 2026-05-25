import {Divider, ListSubheader, MenuItem} from '@mui/material';
import {Check as CheckIcon, Language as LanguageIcon} from '@mui/icons-material';
import type {ReactNode} from 'react';
import {useTranslation} from 'react-i18next';
import {densityClass, useUiPreferences} from '../../styles/UiPreferencesContext';
import {UserProvider} from '../auth/UserContext';
import {Layout} from './Layout';
import {NavMenu, type NavMenuItem, type NavMenuRoleDescriptor, type NavMenuUser} from './NavMenu';

export interface AppShellLanguage {
    code: string;
    label: string;
}

const DEFAULT_LANGUAGES: readonly AppShellLanguage[] = [
    {code: 'en', label: 'English'},
    {code: 'ru', label: 'Русский'},
];

// Multilang UI temporarily hidden; flip to true to restore the language switcher.
const MULTILANG_UI_ENABLED = false;

export interface AppShellProps {
    /** Brand text (e.g. "Logistics", "Technologies") — shown next to logo. */
    pluginName: string;
    /** `data-plugin` value on the page-root (lowercase slug, e.g. "logistics"). */
    pluginAttr: string;
    /** Logo image src for the brand mark. */
    logoSrc: string;
    /** SignalR hub URL — drives NavMenu's connection pip. */
    hubUrl: string;
    /** API URL returning version info. Passed through to Layout. */
    versionsApiUrl?: string;
    /** Label before the version in the footer chip. */
    versionChipName?: string;
    /** Which field of the versions response to display. */
    versionChipVersionKey?: 'main' | 'product';
    /** Footer copyright owner. */
    copyrightOwner?: string;
    /** Footer copyright start year. */
    copyrightStartYear?: number;
    /** Active user — typically pulled from Redux by the consumer. */
    user: NavMenuUser | undefined | null;
    /** Map from role id → { label, icon }. */
    roles?: Record<string, NavMenuRoleDescriptor>;
    /** Switch active role; consumer wires the auth PUT + redirect. */
    setRole?: (role: string) => void;
    /** Top-level nav items. Plugins typically build this list role-aware. */
    navItems: NavMenuItem[];
    /** Optional `data-role` attribute on the page-root (drives CSS accent
     *  switch in plugins that style per-role, e.g. Tech). Plugins that
     *  don't theme by role can omit it. */
    roleAttr?: string;
    /** Languages offered in the user-menu language switcher. */
    languages?: readonly AppShellLanguage[];
    /** Extra menu items appended after the language section. */
    extraUserMenuItems?: ReactNode;
    /** Hide top-level nav items while keeping brand + user block. */
    hideMenu?: boolean;
    /** i18n key for the "Language" subheader. Defaults to `'edm-chrome:language'`. */
    languageLabelKey?: string;
    children: ReactNode;
}

export const AppShell = ({
    pluginName,
    pluginAttr,
    logoSrc,
    hubUrl,
    versionsApiUrl,
    versionChipName,
    versionChipVersionKey,
    copyrightOwner,
    copyrightStartYear,
    user,
    roles,
    setRole,
    navItems,
    roleAttr,
    languages = DEFAULT_LANGUAGES,
    extraUserMenuItems,
    hideMenu = false,
    languageLabelKey = 'edm-chrome:language',
    children,
}: AppShellProps) => {
    const {density, scheme} = useUiPreferences();
    const {t, i18n} = useTranslation();

    const activeLng =
        languages.find((l) => l.code === i18n.language)?.code ??
        languages.find((l) => i18n.language?.startsWith(l.code.split('-')[0]))?.code ??
        languages[0]?.code ??
        'en';

    const languageMenuItems = (
        <>
            <Divider />
            <ListSubheader
                sx={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10.5,
                    lineHeight: '24px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--ink-4)',
                    background: 'transparent',
                    pl: 2,
                }}
            >
                {t(languageLabelKey, 'Language')}
            </ListSubheader>
            {languages.map(({code, label}) => (
                <MenuItem
                    key={code}
                    selected={code === activeLng}
                    onClick={() => i18n.changeLanguage(code)}
                    sx={{pr: 2}}
                >
                    <LanguageIcon fontSize="small" sx={{mr: 1.5, color: 'var(--ink-3)'}} />
                    <span style={{flex: 1}}>{label}</span>
                    {code === activeLng && (
                        <CheckIcon fontSize="small" sx={{color: 'var(--accent)'}} />
                    )}
                </MenuItem>
            ))}
            {extraUserMenuItems}
        </>
    );

    const navMenu = (
        <NavMenu
            hubUrl={hubUrl}
            pluginName={pluginName}
            logoSrc={logoSrc}
            user={user ?? undefined}
            roles={roles}
            setRole={setRole}
            navItems={hideMenu ? [] : navItems}
            extraUserMenuItems={MULTILANG_UI_ENABLED ? languageMenuItems : extraUserMenuItems}
        />
    );

    return (
        <div
            className={`page-root ${densityClass(density)}`}
            data-scheme={scheme}
            data-plugin={pluginAttr}
            data-role={roleAttr || undefined}
        >
            <UserProvider value={user ?? undefined}>
                <Layout
                    navMenu={navMenu}
                    versionsApiUrl={versionsApiUrl}
                    versionChipName={versionChipName}
                    versionChipVersionKey={versionChipVersionKey}
                    copyrightOwner={copyrightOwner}
                    copyrightStartYear={copyrightStartYear}
                >
                    {children}
                </Layout>
            </UserProvider>
        </div>
    );
};
