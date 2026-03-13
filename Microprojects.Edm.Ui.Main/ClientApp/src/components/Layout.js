import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Divider, Link as MuiLink, Stack, Chip } from '@mui/material';
import { NavMenu } from './NavMenu';
import styles from './Layout.module.scss';

export const Layout = (props) => {
    const currYear = new Date().getFullYear();
    const version = "0.1.0"; // From package.json

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
                        label={`v ${version}`} 
                        size="small" 
                        variant="outlined" 
                        className={styles.versionChip}
                    />
                    <MuiLink href="#" className={styles.footerLink}>
                        <Typography variant="caption" color="textSecondary">
                            Documentation
                        </Typography>
                    </MuiLink>
                    <MuiLink href="#" className={styles.footerLink}>
                        <Typography variant="caption" color="textSecondary">
                            Support
                        </Typography>
                    </MuiLink>
                </Stack>
            </Box>
        </Box>
    );
}

Layout.propTypes = {
    children: PropTypes.any
};
