import React, {useEffect, useMemo, useState} from 'react';
import {useSelector} from 'react-redux';
import {NavLink} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
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

function useClock(lng: string): string {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(t);
    }, []);
    const locale = lng?.startsWith('ru') ? 'ru-RU' : 'en-GB';
    return now.toLocaleString(locale, {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

export function Home() {
    const userFull = useSelector((state: RootState) => state.user.name);
    const user = displayUserName(userFull);
    const userRole = useSelector((state: RootState) => state.user.role);
    const {t, i18n} = useTranslation('tech');
    const clock = useClock(i18n.language);

    const roleLabel = useMemo<Record<string, string>>(() => ({
        [appRoles.admin]:        t('roles.administrator'),
        [appRoles.technologist]: t('roles.technologist'),
        [appRoles.operator]:     t('roles.operator'),
    }), [t]);

    const cards: LauncherCard[] = [
        {
            title: t('home.cards.startOperation.title'),
            description: t('home.cards.startOperation.description'),
            cta: t('home.cards.startOperation.cta'),
            path: '/operation',
            icon: <RunIcon />,
            hueClass: styles.run,
        },
        {
            title: t('home.cards.dashboard.title'),
            description: t('home.cards.dashboard.description'),
            cta: userRole === appRoles.operator ? t('home.cards.dashboard.ctaOperator') : t('home.cards.dashboard.cta'),
            path: userRole === appRoles.operator ? '/dashboard/operations' : '/dashboard',
            icon: <DashboardIcon />,
            hueClass: styles.dashboard,
        },
        {
            title: t('home.cards.configuration.title'),
            description: t('home.cards.configuration.description'),
            cta: t('home.cards.configuration.cta'),
            path: '/config/processes',
            icon: <ConfigIcon />,
            hueClass: styles.config,
            roles: [appRoles.admin, appRoles.technologist],
        },
        {
            title: t('home.cards.plugins.title'),
            description: t('home.cards.plugins.description'),
            cta: t('home.cards.plugins.cta'),
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
                        <div className={styles.heroEyebrow}>{t('home.welcome')}</div>
                        <h1 className={styles.heroTitle} title={userFull || undefined}>
                            {user ? t('home.hello', {name: user}) : t('home.welcomeToEdm')}
                        </h1>
                        <p className={styles.heroLead}>
                            {t('home.lead')}
                        </p>
                    </div>
                    <div className={styles.heroMeta}>
                        {userRole && (
                            <span><b>{t('home.role')}</b> · {roleLabel[userRole] || userRole}</span>
                        )}
                        <span>{clock}</span>
                    </div>
                </header>

                <section className={styles.section}>
                    <header className={styles.sectionHeader}>
                        <span className={styles.sectionNum}>{t('home.quickLaunchNum')}</span>
                        <h2 className={styles.sectionTitle}>{t('home.quickLaunch')}</h2>
                        <p className={styles.sectionTagline}>{t('home.quickLaunchTagline')}</p>
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
