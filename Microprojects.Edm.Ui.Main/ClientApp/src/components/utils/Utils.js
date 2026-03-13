import React from 'react';
import PropTypes from 'prop-types';
import { 
    CircularProgress, 
    Box, 
    Typography, 
    Skeleton, 
    LinearProgress,
    Button,
    Grid,
} from '@mui/material';
import {
    TouchApp as TouchAppIcon,
    ErrorOutline as ErrorOutlineIcon,
    Refresh as RefreshIcon,
    ArrowBack as ArrowBackIcon,
    Add as AddIcon
} from '@mui/icons-material';

export function Loading() {
    return (
        <Box sx={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="rectangular" width={56} height={56} sx={{ borderRadius: 2 }} />
                <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" height={24} />
                    <Skeleton variant="text" width="40%" height={16} />
                </Box>
            </Box>
            <LinearProgress sx={{ height: 4 }} />
            <Box sx={{ p: 3, flex: 1 }}>
                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 3, mb: 2 }}>
                    <Skeleton variant="text" width="30%" height={20} sx={{ mb: 3 }} />
                    <Grid container spacing={3}>
                        <Grid item xs={6}><Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1 }} /></Grid>
                        <Grid item xs={6}><Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1 }} /></Grid>
                        <Grid item xs={12}><Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1 }} /></Grid>
                        <Grid item xs={6}><Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1 }} /></Grid>
                    </Grid>
                </Box>
                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 3 }}>
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

DetailStub.propTypes = {
    message: PropTypes.string,
    onAdd: PropTypes.func
}

export function DetailStub({ message, onAdd }) {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                padding: 6,
                textAlign: 'center',
                minHeight: '400px'
            }}
        >
            <Box
                sx={{
                    width: 120,
                    height: 120,
                    backgroundColor: '#f5f5f5',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 3,
                    color: '#bdbdbd'
                }}
            >
                <TouchAppIcon sx={{ fontSize: 64 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#424242', mb: 1 }}>
                Select an Item
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400, mb: 3, lineHeight: 1.6 }}>
                {message || 'Choose an item from the list on the left to view its details, or create a new item to get started.'}
            </Typography>
            {onAdd && (
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={onAdd}
                    sx={{ textTransform: 'none', borderRadius: '4px', px: 3, py: 1.5 }}
                >
                    Create New Item
                </Button>
            )}
        </Box>
    );
}

ErrorStub.propTypes = {
    error: PropTypes.string,
    code: PropTypes.string,
    onRefresh: PropTypes.func,
    onBack: PropTypes.func
}

export function ErrorStub({ error, code, onRefresh, onBack }) {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                padding: 6,
                textAlign: 'center',
                minHeight: '400px'
            }}
        >
            <Box
                sx={{
                    width: 80,
                    height: 80,
                    backgroundColor: '#ffebee',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 3,
                    color: '#d32f2f'
                }}
            >
                <ErrorOutlineIcon sx={{ fontSize: 40 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#c62828', mb: 1 }}>
                Failed to Load Data
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400, mb: 3, lineHeight: 1.6 }}>
                {error || "We couldn't load the requested information. This might be due to a network issue or the item may no longer exist."}
            </Typography>
            {code && (
                <Typography
                    sx={{
                        backgroundColor: '#f5f5f5',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        color: '#616161',
                        marginBottom: 3
                    }}
                >
                    Error Code: {code}
                </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 2 }}>
                {onRefresh && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<RefreshIcon />}
                        onClick={onRefresh}
                        sx={{ textTransform: 'none', borderRadius: '4px' }}
                    >
                        Try Again
                    </Button>
                )}
                {onBack && (
                    <Button
                        variant="outlined"
                        color="inherit"
                        startIcon={<ArrowBackIcon />}
                        onClick={onBack}
                        sx={{ textTransform: 'none', borderRadius: '4px', color: '#616161', borderColor: '#e0e0e0' }}
                    >
                        Go Back
                    </Button>
                )}
            </Box>
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
