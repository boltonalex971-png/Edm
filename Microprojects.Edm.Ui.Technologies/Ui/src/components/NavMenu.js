import React, { useState } from 'react';
import {
    IconButton,
    Box,
    Menu,
    MenuItem,
    Avatar,
    Divider,
    Typography,
    Select,
    FormControl,
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
    Home as HomeIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import api from './api';
import { appRoles } from '../ApiContext';

const ROLES = {
    [appRoles.admin]: { label: 'Administrator', icon: <BusinessIcon fontSize="small" /> },
    [appRoles.technologist]: { label: 'Technologist', icon: <EngineeringIcon fontSize="small" /> },
    [appRoles.operator]: { label: 'Operator', icon: <OperatorIcon fontSize="small" /> }
};

export const NavMenu = () => {
    const user = useSelector(s => s.user);
    const location = useLocation();
    const [userMenuAnchor, setUserMenuAnchor] = useState(null);

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

    const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';

    return (
        <header className="doc-top">
            <Link to="/" className="doc-brand">
                <span className="brand-line">
                    <span className="brand-block"><span className="ed">ED</span><span className="mu">µ</span></span>
                    <span className="brand-name">Technologies</span>
                </span>
            </Link>

            <nav className="doc-nav">
                {navItems.map((item) => (
                    <Link
                        key={item.id}
                        to={item.path}
                        className={`nav-link ${isPathActive(item.path, item.exact) ? 'active' : ''}`}
                    >
                        {item.icon}
                        {item.label}
                    </Link>
                ))}
            </nav>

            <Box className="doc-end">
                {user && user.roles && (
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <Select
                            value={user.role || ''}
                            onChange={(e) => setRole(e.target.value)}
                            displayEmpty
                            variant="outlined"
                            sx={{
                                height: 32,
                                fontFamily: 'var(--font-mono)',
                                fontSize: 11,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                fontWeight: 700,
                            }}
                            renderValue={(value) => (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {ROLES[value]?.icon}
                                    <span>{ROLES[value]?.label || value}</span>
                                </Box>
                            )}
                        >
                            {user.roles.map((role) => (
                                <MenuItem key={role} value={role}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {ROLES[role]?.icon}
                                        {ROLES[role]?.label || role}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}

                {user?.name && (
                    <Box
                        className="av"
                        onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                        title={user.name}
                    >
                        {initials}
                    </Box>
                )}
            </Box>

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
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-1)' }}>
                                {user.name}
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
