import React, { useState } from 'react';
import {
    Box,
    Menu,
    MenuItem,
    Avatar,
    Divider,
    Typography,
    Chip
} from '@mui/material';
import {
    Settings as SettingsIcon,
    ExitToApp as LogoutIcon,
    Person as PersonIcon,
    Business as BusinessIcon,
    Engineering as EngineeringIcon,
    PersonOutline as OperatorIcon,
    Dashboard as DashboardIcon,
    SettingsApplications as ConfigIcon,
    Extension as PluginsIcon,
    Home as HomeIcon,
    Search as SearchIcon,
    KeyboardArrowDown as ArrowDownIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import api from './api';
import { appRoles } from '../ApiContext';
import { displayUserName, userInitials } from './utils/userName';
import applogo from '../assets/applogo.svg';

const ROLES = {
    [appRoles.admin]: { label: 'Administrator', icon: <BusinessIcon fontSize="small" /> },
    [appRoles.technologist]: { label: 'Technologist', icon: <EngineeringIcon fontSize="small" /> },
    [appRoles.operator]: { label: 'Operator', icon: <OperatorIcon fontSize="small" /> }
};

// IMPROVISED · v2 04f.4 chrome demands a connection pip. Real status will
// come from useConnectionState (Phase F) once the SignalR lifecycle is
// surfaced; for now the pip is hardcoded to 'connected' so the slot ships.
const CONNECTION_STATUS = { kind: 'connected', label: 'Live' };

export const NavMenu = () => {
    const user = useSelector(s => s.user);
    const location = useLocation();
    const [userMenuAnchor, setUserMenuAnchor] = useState(null);
    const [roleMenuAnchor, setRoleMenuAnchor] = useState(null);

    const setRole = (role) =>
        axios.put(`${api.auth}/user/role`, JSON.stringify(role), { headers: { 'Content-Type': 'application/json' } })
            .then(() => window.location.reload())
            .catch(r => alert(r.response?.data?.detail || r.message));

    const isPathActive = (path, exact) => {
        if (exact) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    const navItems = [{ id: 'home', label: 'Home', path: '/', icon: <HomeIcon fontSize="small" />, exact: true }];
    if (user && user.role === appRoles.operator) {
        navItems.push({ id: 'operations', label: 'Operations', path: '/dashboard/operations', icon: <ConfigIcon fontSize="small" /> });
    } else if (user && user.role) {
        navItems.push({ id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon fontSize="small" /> });
        navItems.push({ id: 'config', label: 'Configuration', path: '/config', icon: <ConfigIcon fontSize="small" /> });
        navItems.push({ id: 'plugins', label: 'Plugins', path: '/plugins', icon: <PluginsIcon fontSize="small" /> });
    }

    const initials = userInitials(user?.name);
    const userShort = displayUserName(user?.name);
    const activeRole = user?.role ? ROLES[user.role] : null;

    return (
        <header className="doc-top" data-sticky-header="true">
            <Link to="/" className="doc-brand">
                <img className="brand-mark" src={applogo} alt="EDµ" width="42" height="30" />
                <span className="brand-name">Technologies</span>
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

            {user && user.roles && activeRole && (
                <button
                    type="button"
                    className={`tb-role ${user.role}`}
                    onClick={(e) => setRoleMenuAnchor(e.currentTarget)}
                >
                    <span className="tb-role-icon">{activeRole.icon}</span>
                    <span className="tb-role-text">{activeRole.label}</span>
                    <ArrowDownIcon fontSize="small" className="tb-role-chev" />
                </button>
            )}

            <span className={`tb-pip ${CONNECTION_STATUS.kind}`}>
                <span className="dot" />
                <span className="tb-pip-text">{CONNECTION_STATUS.label}</span>
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

            <Menu
                anchorEl={roleMenuAnchor}
                open={Boolean(roleMenuAnchor)}
                onClose={() => setRoleMenuAnchor(null)}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                {user?.roles?.map((role) => (
                    <MenuItem
                        key={role}
                        selected={role === user.role}
                        onClick={() => { setRoleMenuAnchor(null); setRole(role); }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {ROLES[role]?.icon}
                            {ROLES[role]?.label || role}
                        </Box>
                    </MenuItem>
                ))}
            </Menu>

            <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={() => setUserMenuAnchor(null)}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                slotProps={{ paper: { sx: { width: 260, mt: 1 } } }}
            >
                {user?.name && (
                    <Box sx={{ p: 2, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
                                sx={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-1)' }}
                            >
                                {userShort}
                            </Typography>
                            <Chip label={user.role} size="small" sx={{ mt: 0.5 }} />
                        </Box>
                    </Box>
                )}
                <Divider />
                <MenuItem onClick={() => setUserMenuAnchor(null)}>
                    <PersonIcon fontSize="small" sx={{ mr: 1.5 }} />
                    Profile
                </MenuItem>
                <MenuItem onClick={() => setUserMenuAnchor(null)}>
                    <SettingsIcon fontSize="small" sx={{ mr: 1.5 }} />
                    Account Settings
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => setUserMenuAnchor(null)} sx={{ color: 'var(--sig-fault-deep)' }}>
                    <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
                    Logout
                </MenuItem>
            </Menu>
        </header>
    );
};
