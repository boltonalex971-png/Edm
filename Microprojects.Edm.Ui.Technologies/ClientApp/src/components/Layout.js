import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Divider, Stack, Chip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { NavMenu } from './NavMenu';
import api from './api';
import styles from './Layout.module.scss';

export const Layout = (props) => {
    const currYear = new Date().getFullYear();
    const [versions, setVersions] = useState(null);

    useEffect(() => {
        const controller = new AbortController();
        fetch(`${api.meta}/version`, { credentials: 'include', signal: controller.signal })
            .then((r) => (r.ok ? r.json() : null))
            .then((v) => v && setVersions(v))
            .catch(() => { /* leave dashes if unavailable */ });
        return () => controller.abort();
    }, []);

    return (
        <Box className={styles.layoutRoot}>
            <NavMenu />

            <Box component="main" className={styles.mainContent}>
                <Box className={styles.detailWrapper}>
                    {props.children}
                </Box>
            </Box>

            <Box component="footer" className={styles.footer}>
                <Stack direction="row" spacing={3} alignItems="center">
                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
                        &copy; Microprojects 2020 &ndash; {currYear}
                    </Typography>
                    <Divider orientation="vertical" flexItem />
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box className={`${styles.statusIndicator} ${styles.online}`} />
                        <Typography variant="caption" color="textSecondary">
                            System Connected
                        </Typography>
                    </Box>
                </Stack>

                <Stack direction="row" spacing={2} alignItems="center">
                    <Chip
                        label={`Main ${versions?.main ?? '—'}`}
                        size="small"
                        variant="outlined"
                        className={styles.versionChip}
                    />
                    <Chip
                        label={`EDM ${versions?.product ?? '—'}`}
                        size="small"
                        variant="outlined"
                        className={styles.versionChip}
                    />
                    <RouterLink to="/changes" className={styles.footerLink}>
                        <Typography variant="caption" color="textSecondary">
                            What's new
                        </Typography>
                    </RouterLink>
                </Stack>
            </Box>
        </Box>
    );
}

Layout.propTypes = {
    children: PropTypes.any
};
