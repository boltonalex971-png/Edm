import React, {useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import {NavLink} from 'react-router-dom';
import {
    PlayCircleOutline as RunIcon,
    DashboardOutlined as DashboardIcon,
    SettingsOutlined as ConfigIcon,
    ExtensionOutlined as PluginIcon,
    ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import {appRoles} from '../../ApiContext';
import {displayUserName} from '@microprojects/edm-components/utils';
import styles from './Home.module.scss';
import type {RootState} from '../../store';

// HANDOFF · v2 patterns.html · home page is a .page-h hero + .sec
// section + launcher cards using the entity-hue convention. Hues come
// from app.css (process · cobalt, workplace · amber, operation · teal,
// plugin · plum) so each launcher visually links to the surface it opens.

interface LauncherCard {
    title: string;
    description: string;
    cta: string;
    path: string;
    icon: React.ReactNode;
    hueClass: string;
    roles?: string[];
}

const ROLE_LABEL: Record<string, string> = {
    [appRoles.admin]:        'Administrator',
    [appRoles.technologist]: 'Technologist',
    [appRoles.operator]:     'Operator',
};

function useClock(): string {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(t);
    }, []);
    return now.toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

export function Home() {
    const userFull = useSelector((state: RootState) => state.user.name);
    const user = displayUserName(userFull);
    const userRole = useSelector((state: RootState) => state.user.role);
    const clock = useClock();

    const cards: LauncherCard[] = [
        {
            title: 'Start operation',
            description: 'Launch a new hardware test or production process from a workbench.',
            cta: 'New operation',
            path: '/operation',
            icon: <RunIcon />,
            hueClass: styles.run,
        },
        {
            title: 'Dashboard',
            description: 'Monitor real-time status and analyse process data across the floor.',
            cta: userRole === appRoles.operator ? 'Open operations' : 'Open dashboard',
            path: userRole === appRoles.operator ? '/dashboard/operations' : '/dashboard',
            icon: <DashboardIcon />,
            hueClass: styles.dashboard,
        },
        {
            title: 'Configuration',
            description: 'Manage workplaces, hosts and device profiles for the plant.',
            cta: 'Open configuration',
            path: '/config/processes',
            icon: <ConfigIcon />,
            hueClass: styles.config,
            roles: [appRoles.admin, appRoles.technologist],
        },
        {
            title: 'Plugins',
            description: 'Browse system extensions, hardware drivers and operation apps.',
            cta: 'Open plugins',
            path: '/plugins/drivers',
            icon: <PluginIcon />,
            hueClass: styles.plugin,
            roles: [appRoles.admin, appRoles.technologist],
        },
    ];

    const visibleCards = cards.filter(card =>
        !card.roles || (userRole && card.roles.includes(userRole))
    );

    return (
        <div className={styles.homeContainer}>
            <div className={styles.page}>
                <header className={styles.hero}>
                    <div className={styles.heroMain}>
                        <div className={styles.heroEyebrow}>Welcome</div>
                        <h1 className={styles.heroTitle} title={userFull || undefined}>
                            {user ? `Hello, ${user}` : 'Welcome to EDM'}
                        </h1>
                        <p className={styles.heroLead}>
                            Enterprise data management for industrial process monitoring,
                            configuration and analysis. Pick where you want to start.
                        </p>
                    </div>
                    <div className={styles.heroMeta}>
                        {userRole && (
                            <span><b>Role</b> · {ROLE_LABEL[userRole] || userRole}</span>
                        )}
                        <span>{clock}</span>
                    </div>
                </header>

                <section className={styles.section}>
                    <header className={styles.sectionHeader}>
                        <span className={styles.sectionNum}>01</span>
                        <h2 className={styles.sectionTitle}>Quick launch</h2>
                        <p className={styles.sectionTagline}>Pick a surface to jump into.</p>
                    </header>

                    <div className={styles.launcherGrid}>
                        {visibleCards.map((card) => (
                            <NavLink
                                key={card.path}
                                to={card.path}
                                className={`${styles.card} ${card.hueClass}`}
                            >
                                <div className={styles.cardHead}>
                                    <div className={`${styles.cardIcon} ${card.hueClass}`}>
                                        {card.icon}
                                    </div>
                                    <div className={styles.cardArrow}>
                                        <ArrowIcon />
                                    </div>
                                </div>
                                <h3 className={styles.cardTitle}>{card.title}</h3>
                                <p className={styles.cardDescription}>{card.description}</p>
                                <span className={styles.cardCta}>{card.cta}</span>
                            </NavLink>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default Home;
