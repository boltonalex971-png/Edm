import React from 'react';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import {
    PlayCircleFilled as PlayCircleFilledIcon,
    Dashboard as DashboardIcon,
    SettingsApplications as SettingsApplicationsIcon,
    Extension as ExtensionIcon
} from '@mui/icons-material';
import { appRoles } from '../../ApiContext';
import { displayUserName } from '../utils/userName';
import styles from './Home.module.scss';
import type { RootState } from '../../store';

interface LauncherCard {
    title: string;
    description: string;
    path: string;
    icon: React.ReactNode;
    colorClass: string;
    roles?: string[];
}

export function Home() {
    const userFull = useSelector((state: RootState) => state.user.name);
    const user = displayUserName(userFull);
    const userRole = useSelector((state: RootState) => state.user.role);

    const cards: LauncherCard[] = [
        {
            title: 'Start Operation',
            description: 'Launch a new hardware test or production process.',
            path: '/operation',
            icon: <PlayCircleFilledIcon />,
            colorClass: styles.bgSuccess,
        },
        {
            title: 'Dashboard',
            description: 'Monitor real-time status and analyze process data.',
            path: userRole === appRoles.operator ? '/dashboard/operations' : '/dashboard',
            icon: <DashboardIcon />,
            colorClass: styles.bgInfo,
        },
        {
            title: 'Configuration',
            description: 'Manage workplaces, hosts, and device profiles.',
            path: '/config/processes',
            icon: <SettingsApplicationsIcon />,
            colorClass: styles.bgWarning,
            roles: [appRoles.admin, appRoles.technologist],
        },
        {
            title: 'Plugins',
            description: 'Manage system extensions and hardware drivers.',
            path: '/plugins/drivers',
            icon: <ExtensionIcon />,
            colorClass: styles.bgIndigo,
            roles: [appRoles.admin, appRoles.technologist],
        },
    ];

    const visibleCards = cards.filter(card => 
        !card.roles || (userRole && card.roles.includes(userRole))
    );

    return (
        <Box className={styles.homeContainer}>
            <section className={styles.hero}>
                <Typography variant="h1" title={userFull || undefined}>
                    Welcome, {user}
                </Typography>
                <Typography variant="body1">
                    Enterprise Data Management solution for industrial process monitoring, configuration, and analysis.
                </Typography>
            </section>

            <Box className={styles.launcherGrid}>
                {visibleCards.map((card, index) => (
                    <NavLink key={index} to={card.path} className={styles.card}>
                        <Box className={`${styles.iconCircle} ${card.colorClass}`}>
                            {card.icon}
                        </Box>
                        <Typography variant="h3">
                            {card.title}
                        </Typography>
                        <Typography variant="body2">
                            {card.description}
                        </Typography>
                    </NavLink>
                ))}
            </Box>
        </Box>
    );
}

export default Home;
