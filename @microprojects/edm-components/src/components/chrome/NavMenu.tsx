import React, {useState} from 'react';
import {
    Box,
    Menu,
    MenuItem,
    Avatar,
    Divider,
    Typography,
    Chip,
    ListSubheader,
} from '@mui/material';
import {
    Settings as SettingsIcon,
    ExitToApp as LogoutIcon,
    Person as PersonIcon,
    Search as SearchIcon,
    KeyboardArrowDown as ArrowDownIcon,
    DensitySmall as DensityCompactIcon,
    DensityMedium as DensityComfortIcon,
    DensityLarge as DensityTouchIcon,
    LightModeOutlined as LightIcon,
    DarkModeOutlined as DarkIcon,
    Check as CheckIcon,
} from '@mui/icons-material';
import {Link, useLocation} from 'react-router-dom';
import {displayUserName, userInitials} from '../../utils/userName';
import {useConnectionState, STATUS_TO_PIP, UseConnectionStateOptions} from '../realtime/useConnectionState';
import {useUiPreferences} from '../../styles/UiPreferencesContext';
import type {Density} from '../../styles/density';
import type {Scheme} from '../../styles/scheme';

export interface NavMenuUser {
    name?: string;
    role?: string;
    roles?: string[];
}

export interface NavMenuRoleDescriptor {
    label: string;
    icon: React.ReactNode;
}

export interface NavMenuItem {
    id: string;
    label: React.ReactNode;
    path: string;
    icon?: React.ReactNode;
    exact?: boolean;
}

interface NavMenuProps {
    /** SignalR hub URL — drives the connection pip. */
    hubUrl: string;
    /** Optional auth-token override for the hub connection (defaults to X-Auth-Token cookie). */
    connectionOptions?: UseConnectionStateOptions;
    /** Brand text shown next to the logo (e.g. "Technologies", "Logistics"). */
    pluginName: React.ReactNode;
    /** Optional logo image src. Omitting hides the brand mark. */
    logoSrc?: string;
    /** Brand link target; defaults to "/". */
    homeHref?: string;
    /** Active user — typically pulled from a Redux selector by the consumer. */
    user?: NavMenuUser | null;
    /** Map from role-id → { label, icon }. Required if the user has roles. */
    roles?: Record<string, NavMenuRoleDescriptor>;
    /** Switch active role (PUT to the auth API; consumer also handles reload). */
    setRole?: (role: string) => void;
    /** Top-level nav items shown in the doc-nav bar. */
    navItems: NavMenuItem[];
    /** Extra menu sections to inject after the standard preferences (Profile / Logout etc). */
    extraUserMenuItems?: React.ReactNode;
    /** Override the default Logout MenuItem behaviour. Omitting hides the row. */
    onLogout?: () => void;
}

const DENSITY_OPTIONS: Array<{value: Density; label: string; Icon: typeof DensityCompactIcon}> = [
    {value: 'compact',     label: 'Compact',     Icon: DensityCompactIcon},
    {value: 'comfortable', label: 'Comfortable', Icon: DensityComfortIcon},
    {value: 'touch',       label: 'Touch',       Icon: DensityTouchIcon},
];

const SCHEME_OPTIONS: Array<{value: Scheme; label: string; Icon: typeof LightIcon}> = [
    {value: 'light', label: 'Light', Icon: LightIcon},
    {value: 'dark',  label: 'Dark',  Icon: DarkIcon},
];

export const NavMenu = ({
    hubUrl,
    connectionOptions,
    pluginName,
    logoSrc,
    homeHref = '/',
    user,
    roles,
    setRole,
    navItems,
    extraUserMenuItems,
    onLogout,
}: NavMenuProps) => {
    const location = useLocation();
    const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null);
    const [roleMenuAnchor, setRoleMenuAnchor] = useState<HTMLElement | null>(null);
    /* HANDOFF · v2 04f.4 · live SignalR status drives the chrome pip. */
    const {status: connStatus} = useConnectionState(hubUrl, connectionOptions);
    const pip = STATUS_TO_PIP[connStatus];

    const isPathActive = (path: string, exact?: boolean) => {
        if (exact) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    const initials = userInitials(user?.name);
    const userShort = displayUserName(user?.name);
    const activeRole = user?.role && roles ? roles[user.role] : null;
    const {density, scheme, setDensity, setScheme} = useUiPreferences();

    return (
        <header className="doc-top" data-sticky-header="true">
            <Link to={homeHref} className="doc-brand">
                {logoSrc && <img className="brand-mark" src={logoSrc} alt="" width="42" height="30" />}
                <span className="brand-name">{pluginName}</span>
            </Link>

            <nav className="doc-nav">
                {navItems.map((item) => (
                    <Link
                        key={item.id}
                        to={item.path}
                        className={`nav-link ${isPathActive(item.path, item.exact) ? 'active' : ''}`}
                    >
                        {item.icon}
                        <span className="nav-label">{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="tb-spacer" aria-hidden="true" />

            {/* IMPROVISED · v2 04f.3 search slot — visual only; ⌘K wiring lands when search is built. */}
            <button type="button" className="tb-search" tabIndex={-1}>
                <SearchIcon fontSize="small" className="tb-search-icon" />
                <span className="tb-search-text">Search…</span>
                <span className="kbd">⌘K</span>
            </button>

            {user && user.roles && activeRole && setRole && (
                <button
                    type="button"
                    className={`tb-role ${user.role || ''}`}
                    onClick={(e) => setRoleMenuAnchor(e.currentTarget)}
                >
                    <span className="tb-role-icon">{activeRole.icon}</span>
                    <span className="tb-role-text">{activeRole.label}</span>
                    <ArrowDownIcon fontSize="small" className="tb-role-chev" />
                </button>
            )}

            <span className={`tb-pip ${pip.kind}`} title={`Hub status: ${pip.label.toLowerCase()}`}>
                <span className="dot" />
                <span className="tb-pip-text">{pip.label}</span>
            </span>

            {user?.name && (
                <Box
                    className="av"
                    onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                    title={user.name}
                >
                    {initials}
                </Box>
            )}

            {setRole && (
                <Menu
                    anchorEl={roleMenuAnchor}
                    open={Boolean(roleMenuAnchor)}
                    onClose={() => setRoleMenuAnchor(null)}
                    transformOrigin={{horizontal: 'right', vertical: 'top'}}
                    anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
                >
                    {user?.roles?.map((role) => (
                        <MenuItem
                            key={role}
                            selected={role === user.role}
                            onClick={() => { setRoleMenuAnchor(null); setRole(role); }}
                        >
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                {roles?.[role]?.icon}
                                {roles?.[role]?.label || role}
                            </Box>
                        </MenuItem>
                    ))}
                </Menu>
            )}

            <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={() => setUserMenuAnchor(null)}
                transformOrigin={{horizontal: 'right', vertical: 'top'}}
                anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
                slotProps={{paper: {sx: {width: 260, mt: 1}}}}
            >
                {user?.name && (
                    <Box sx={{p: 2, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1.5}}>
                        <Avatar sx={{
                            width: 40,
                            height: 40,
                            bgcolor: 'var(--accent)',
                            color: 'var(--accent-fg)',
                            fontSize: 14,
                            fontWeight: 700,
                            borderRadius: 1,
                        }}>
                            {initials}
                        </Avatar>
                        <Box>
                            <Typography
                                title={user.name}
                                sx={{fontSize: 13, fontWeight: 700, color: 'var(--ink-1)'}}
                            >
                                {userShort}
                            </Typography>
                            {user.role && <Chip label={user.role} size="small" sx={{mt: 0.5}} />}
                        </Box>
                    </Box>
                )}
                <Divider />
                <MenuItem onClick={() => setUserMenuAnchor(null)}>
                    <PersonIcon fontSize="small" sx={{mr: 1.5}} />
                    Profile
                </MenuItem>
                <MenuItem onClick={() => setUserMenuAnchor(null)}>
                    <SettingsIcon fontSize="small" sx={{mr: 1.5}} />
                    Account Settings
                </MenuItem>

                <Divider />
                <ListSubheader sx={{
                    fontFamily: 'var(--font-mono)', fontSize: 10.5, lineHeight: '24px',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    color: 'var(--ink-4)', background: 'transparent',
                    pl: 2,
                }}>
                    Density
                </ListSubheader>
                {DENSITY_OPTIONS.map(({value, label, Icon}) => (
                    <MenuItem
                        key={value}
                        selected={density === value}
                        onClick={() => setDensity(value)}
                        sx={{pr: 2}}
                    >
                        <Icon fontSize="small" sx={{mr: 1.5, color: 'var(--ink-3)'}} />
                        <span style={{flex: 1}}>{label}</span>
                        {density === value && <CheckIcon fontSize="small" sx={{color: 'var(--accent)'}} />}
                    </MenuItem>
                ))}

                <Divider />
                <ListSubheader sx={{
                    fontFamily: 'var(--font-mono)', fontSize: 10.5, lineHeight: '24px',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    color: 'var(--ink-4)', background: 'transparent',
                    pl: 2,
                }}>
                    Scheme
                </ListSubheader>
                {SCHEME_OPTIONS.map(({value, label, Icon}) => (
                    <MenuItem
                        key={value}
                        selected={scheme === value}
                        onClick={() => setScheme(value)}
                        sx={{pr: 2}}
                    >
                        <Icon fontSize="small" sx={{mr: 1.5, color: 'var(--ink-3)'}} />
                        <span style={{flex: 1}}>{label}</span>
                        {scheme === value && <CheckIcon fontSize="small" sx={{color: 'var(--accent)'}} />}
                    </MenuItem>
                ))}

                {extraUserMenuItems}

                {onLogout && (
                    <>
                        <Divider />
                        <MenuItem
                            onClick={() => { setUserMenuAnchor(null); onLogout(); }}
                            sx={{color: 'var(--sig-fault-deep)'}}
                        >
                            <LogoutIcon fontSize="small" sx={{mr: 1.5}} />
                            Logout
                        </MenuItem>
                    </>
                )}
            </Menu>
        </header>
    );
};
