import React, { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { NavLink, useLocation } from 'react-router-dom';
import styles from './SubRootPage.module.scss';

export const SubRootPage = ({ title, menuItems, children }) => {
    const [isDense, setIsDense] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            setIsDense(prev => {
                if (!prev && scrollY > 25) return true;
                if (prev && scrollY < 10) return false;
                return prev;
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isPathActive = (path) => {
        return location.pathname.startsWith(path);
    };

    return (
        <Box className={styles.container}>
            <Box className={`${styles.header} ${isDense ? styles.isDense : ''}`} data-sticky-header="true">
                <Typography variant="h5" className={styles.title}>
                    {title}
                </Typography>
                <Box className={styles.segmentedControl}>
                    {menuItems.map((item) => (
                        <Button
                            key={item.path}
                            component={NavLink}
                            to={item.path}
                            className={`${styles.segmentBtn} ${isPathActive(item.path) ? styles.active : ''}`}
                            startIcon={item.icon}
                        >
                            {item.label}
                        </Button>
                    ))}
                </Box>
            </Box>
            <Box className={styles.content}>
                {children}
            </Box>
        </Box>
    );
};

export default SubRootPage;
