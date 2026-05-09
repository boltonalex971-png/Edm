import React from 'react';
import PropTypes from 'prop-types';
import {
    CircularProgress,
    Box,
    Skeleton,
    LinearProgress,
    Grid,
} from '@mui/material';

/* DetailStub / ErrorStub kept here as PropTypes-validated re-exports of
   the canonical v2 state surfaces (states/EmptyState, states/ErrorState).
   New code should import directly from those modules. */
export {DetailStub} from '../states/EmptyState';
export {ErrorStub} from '../states/ErrorState';

export function Loading() {
    return (
        <Box sx={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="rectangular" width={56} height={56} sx={{ borderRadius: 2 }} />
                <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" height={24} />
                    <Skeleton variant="text" width="40%" height={16} />
                </Box>
            </Box>
            <LinearProgress sx={{ height: 4 }} />
            <Box sx={{ p: 3, flex: 1 }}>
                <Box sx={{ border: '1px solid var(--line)', borderRadius: 1, p: 3, mb: 2 }}>
                    <Skeleton variant="text" width="30%" height={20} sx={{ mb: 3 }} />
                    <Grid container spacing={3}>
                        <Grid item xs={6}><Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1 }} /></Grid>
                        <Grid item xs={6}><Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1 }} /></Grid>
                        <Grid item xs={12}><Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1 }} /></Grid>
                        <Grid item xs={6}><Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1 }} /></Grid>
                    </Grid>
                </Box>
                <Box sx={{ border: '1px solid var(--line)', borderRadius: 1, p: 3 }}>
                    <Skeleton variant="text" width="30%" height={20} sx={{ mb: 3 }} />
                    <Grid container spacing={3}>
                        <Grid item xs={6}><Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1 }} /></Grid>
                        <Grid item xs={6}><Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1 }} /></Grid>
                    </Grid>
                </Box>
            </Box>
        </Box>
    );
}

LoadingContainer.propTypes = {
    loading: PropTypes.bool,
    children: PropTypes.node
};

export function LoadingContainer({ loading, children }) {
    return (
        <Box sx={{ position: 'relative' }}>
            {children}
            {loading &&
                <Box sx={{ 
                    width: '100%', 
                    height: '100%', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    zIndex: 10
                }}>
                    <CircularProgress size={32} />
                </Box>
            }
        </Box>
    );
}

export function dateToSpan(dateToConvert) {
    const dividerToSeconds = 1000;
    const now = new Date();
    const date = new Date(dateToConvert);
    const span = Math.abs(now - date);
    const days = Math.floor(span / dividerToSeconds / 60 / 60 / 24);
    const hours = Math.floor(span / dividerToSeconds / 60 / 60 % 24);
    const minutes = Math.floor(span / dividerToSeconds / 60 % 60);
    const seconds = Math.floor(span / dividerToSeconds % 60);
    const sDays = days ? days + 'd ' : '';
    const sHours = hours || days && (minutes || seconds) ? hours + 'h ' : "";
    const sMinutes = minutes || (days || hours) && seconds ? minutes + 'm ' : "";
    const sSeconds = seconds ? seconds + 's' : "";

    return sDays + sHours + sMinutes + sSeconds;
}

export function dateToHumanSpan(dateToConvert) {
    const dividerToSeconds = 1000;
    const now = new Date();
    const date = new Date(dateToConvert);
    const span = Math.abs(now - date);
    const days = Math.floor(span / dividerToSeconds / 60 / 60 / 24);
    const hours = Math.floor(span / dividerToSeconds / 60 / 60 % 24);
    const minutes = Math.floor(span / dividerToSeconds / 60 % 60);
    const seconds = Math.floor(span / dividerToSeconds % 60);
    const result = days && (days === 1 ? 'yesterday' : `${days} days`) ||
        hours && (hours === 1 ? 'an hour' : `${hours} hours`) ||
        minutes && (minutes === 1 ? 'a minute' : `${minutes} minutes`) ||
        seconds && (seconds === 1 ? 'a second' : `${seconds} seconds`);

    return `${result}${days !== 1 ? ' ago' : ''}`;
}

export function utcDateToLocal(utcDate) {
    if (!utcDate){
        return;
    }

    const utc = new Date(utcDate);
    const offset = utc.getTimezoneOffset();
    const date = new Date(utc.getTime() - offset * 60 * 1000);
    return date;
}
