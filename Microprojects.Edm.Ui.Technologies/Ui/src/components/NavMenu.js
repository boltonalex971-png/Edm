import React, { useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Box,
    Menu,
    MenuItem,
    Avatar,
    Divider,
    Button,
    Tooltip,
    Badge,
    Chip,
    Select,
    FormControl,
    useTheme
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    Settings as SettingsIcon,
    ExitToApp as LogoutIcon,
    Person as PersonIcon,
    Dashboard as DashboardIcon,
    SettingsApplications as ConfigIcon,
    Extension as PluginsIcon,
    Help as HelpIcon,
    KeyboardArrowDown as ArrowDownIcon,
    Business as BusinessIcon,
    Engineering as EngineeringIcon,
    PersonOutline as OperatorIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { Link, useLocation, useHistory } from 'react-router-dom';
import axios from 'axios';
import api from './api';
import { appRoles } from '../ApiContext';
import logo from '../../public/applogo.svg';
import styles from './NavMenu.module.scss';

const ROLES = {
    [appRoles.admin]: {
        label: 'Administrator',
        icon: <BusinessIcon fontSize="small" />,
    },
    [appRoles.technologist]: {
        label: 'Technologist',
        icon: <EngineeringIcon fontSize="small" />,
    },
    [appRoles.operator]: {
        label: 'Operator',
        icon: <OperatorIcon fontSize="small" />,
    }
};

export const NavMenu = (props) => {
    const user = useSelector(s => s.user);
    const location = useLocation();
    const history = useHistory();
    const [userMenuAnchor, setUserMenuAnchor] = useState(null);
    const [notificationsAnchor, setNotificationsAnchor] = useState(null);

    const setRole = (role) =>
        axios.put(`${api.auth}/user/role`, JSON.stringify(role), { headers: { 'Content-Type': 'application/json' } })
            .then(r => {
                window.location.reload();
            })
            .catch(r => alert(r.response?.data?.detail || r.message));

    const handleUserMenuOpen = (event) => {
        setUserMenuAnchor(event.currentTarget);
    };

    const handleUserMenuClose = () => {
        setUserMenuAnchor(null);
    };

    const handleNotificationsOpen = (event) => {
        setNotificationsAnchor(event.currentTarget);
    };

    const handleNotificationsClose = () => {
        setNotificationsAnchor(null);
    };

    const handleLogout = () => {
        handleUserMenuClose();
    };

    const isPathActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const navItems = [];
    if (user && user.role === appRoles.operator) {
        navItems.push({ id: 'operations', label: 'Operations', path: '/dashboard/operations', icon: <ConfigIcon /> });
    } else if (user && user.role) {
        navItems.push({ id: 'dashboard', label: 'Dashboard', path: '/dashboard/operations', icon: <DashboardIcon /> });
        navItems.push({ id: 'config', label: 'Configuration', path: '/config/processes', icon: <ConfigIcon /> });
        navItems.push({ id: 'plugins', label: 'Plugins', path: '/plugins/drivers', icon: <PluginsIcon /> });
    }

    return (
        <AppBar position="fixed" className={styles.appBar} data-sticky-header="true">
            <Toolbar sx={{ minHeight: '64px', px: 3 }}>
                {/* Logo */}
                <Box component={Link} to="/" className={styles.logoContainer}>
                    <img src={logo} alt="EDμ" />
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '18px' }}>
                        Technologies
                    </Typography>
                </Box>

                {/* Navigation */}
                <Box className={styles.navContainer}>
                    <Button
                        component={Link}
                        to="/"
                        className={`${styles.navButton} ${isPathActive('/') ? styles.active : ''}`}
                    >
                        Home
                    </Button>
                    {navItems.map((item) => (
                        <Button
                            key={item.id}
                            component={Link}
                            to={item.path}
                            startIcon={item.icon}
                            className={`${styles.navButton} ${isPathActive(item.path) ? styles.active : ''}`}
                        >
                            {item.label}
                        </Button>
                    ))}
                </Box>

                {/* Actions */}
                <Box className={styles.actionContainer}>
                    {/* Role Selector */}
                    {user && user.roles && (
                        <FormControl size="small" className={styles.roleSelector}>
                            <Select
                                value={user.role}
                                onChange={(e) => setRole(e.target.value)}
                                displayEmpty
                                variant="outlined"
                                renderValue={(value) => (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {ROLES[value]?.icon}
                                        <Typography variant="body2" sx={{ fontSize: '13px' }}>
                                            {ROLES[value]?.label || value}
                                        </Typography>
                                    </Box>
                                )}
                            >
                                {user.roles.map((role) => (
                                    <MenuItem key={role} value={role}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {ROLES[role]?.icon}
                                            <Typography variant="body2">{ROLES[role]?.label || role}</Typography>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {/* Notifications */}
                    <Tooltip title="Notifications">
                        <IconButton onClick={handleNotificationsOpen} className={styles.iconBtn}>
                            <Badge badgeContent={3} color="error">
                                <NotificationsIcon />
                            </Badge>
                        </IconButton>
                    </Tooltip>

                    {/* Help */}
                    <Tooltip title="Help">
                        <IconButton className={styles.iconBtn}>
                            <HelpIcon />
                        </IconButton>
                    </Tooltip>

                    <Divider orientation="vertical" flexItem sx={{ backgroundColor: 'rgba(255,255,255,0.2)', mx: 1 }} />

                    {/* User Menu */}
                    <Box onClick={handleUserMenuOpen} className={styles.userContainer}>
                        <Avatar sx={{ width: 32, height: 32, backgroundColor: '#5c6bc0', fontSize: '14px', fontWeight: 600 }}>
                            {user.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
                        </Avatar>
                        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '13px', lineHeight: 1.2, color: '#fff' }}>
                                {user.name}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '11px', color: '#fff' }}>
                                {user.role}
                            </Typography>
                        </Box>
                        <ArrowDownIcon fontSize="small" sx={{ opacity: 0.7, color: '#fff' }} />
                    </Box>
                </Box>

                {/* Menus... (omitted for brevity, they don't use styled components but standard MUI) */}
                <Menu
                    anchorEl={userMenuAnchor}
                    open={Boolean(userMenuAnchor)}
                    onClose={handleUserMenuClose}
                    PaperProps={{
                        sx: { width: 280, mt: 1.5, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }
                    }}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                    <Box sx={{ p: 2, pb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Avatar sx={{ width: 48, height: 48, backgroundColor: '#1a237e', fontSize: '18px', fontWeight: 600 }}>
                                {user.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
                            </Avatar>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    {user.name}
                                </Typography>
                                <Box sx={{ mt: 0.5 }}>
                                    <Chip label={user.role} size="small" />
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                    <Divider />
                    <MenuItem onClick={handleUserMenuClose} sx={{ py: 1.5 }}>
                        <PersonIcon fontSize="small" sx={{ mr: 1.5, color: '#616161' }} />
                        Profile
                    </MenuItem>
                    <MenuItem onClick={handleUserMenuClose} sx={{ py: 1.5 }}>
                        <SettingsIcon fontSize="small" sx={{ mr: 1.5, color: '#616161' }} />
                        Account Settings
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: '#d32f2f' }}>
                        <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
                        Logout
                    </MenuItem>
                </Menu>

                <Menu
                    anchorEl={notificationsAnchor}
                    open={Boolean(notificationsAnchor)}
                    onClose={handleNotificationsClose}
                    PaperProps={{
                        sx: { width: 360, maxHeight: 480, mt: 1.5, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }
                    }}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                    <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Notifications (3)
                        </Typography>
                    </Box>
                    <MenuItem sx={{ py: 2, borderBottom: '1px solid #f0f0f0' }}>
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>Process completed successfully</Typography>
                            <Typography variant="caption" color="textSecondary">5 minutes ago</Typography>
                        </Box>
                    </MenuItem>
                    <MenuItem sx={{ py: 2, borderBottom: '1px solid #f0f0f0' }}>
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>New device connected</Typography>
                            <Typography variant="caption" color="textSecondary">1 hour ago</Typography>
                        </Box>
                    </MenuItem>
                    <Divider />
                    <Box sx={{ p: 1.5, textAlign: 'center' }}>
                        <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>View all notifications</Typography>
                    </Box>
                </Menu>
            </Toolbar>
        </AppBar>
    );
};
