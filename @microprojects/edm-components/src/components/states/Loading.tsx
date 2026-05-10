import React from 'react';
import {
    CircularProgress,
    Box,
    Skeleton,
    LinearProgress,
    Grid as MuiGrid,
} from '@mui/material';

// MUI v7's typed Grid drops the legacy `item`/`xs`/`md` props (still accepted
// at runtime). Cast to keep the existing call sites compiling without a v2
// migration in this lift — moves to Grid2's `size={{xs, md}}` API in Phase 2.
const Grid: any = MuiGrid;

// Detail-pane loading skeleton — mirrors the live Detail layout (icon + title
// header, divider, two card-shaped body sections) so the page doesn't reflow
// when real content arrives.
export function Loading() {
    return (
        <Box sx={{width: '100%', flex: 1, display: 'flex', flexDirection: 'column'}}>
            <Box sx={{p: 3, borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 2}}>
                <Skeleton variant="rectangular" width={56} height={56} sx={{borderRadius: 2}} />
                <Box sx={{flex: 1}}>
                    <Skeleton variant="text" width="60%" height={24} />
                    <Skeleton variant="text" width="40%" height={16} />
                </Box>
            </Box>
            <LinearProgress sx={{height: 4}} />
            <Box sx={{p: 3, flex: 1}}>
                <Box sx={{border: '1px solid var(--line)', borderRadius: 1, p: 3, mb: 2}}>
                    <Skeleton variant="text" width="30%" height={20} sx={{mb: 3}} />
                    <Grid container spacing={3}>
                        <Grid item xs={6}><Skeleton variant="rectangular" height={48} sx={{borderRadius: 1}} /></Grid>
                        <Grid item xs={6}><Skeleton variant="rectangular" height={48} sx={{borderRadius: 1}} /></Grid>
                        <Grid item xs={12}><Skeleton variant="rectangular" height={48} sx={{borderRadius: 1}} /></Grid>
                        <Grid item xs={6}><Skeleton variant="rectangular" height={48} sx={{borderRadius: 1}} /></Grid>
                    </Grid>
                </Box>
                <Box sx={{border: '1px solid var(--line)', borderRadius: 1, p: 3}}>
                    <Skeleton variant="text" width="30%" height={20} sx={{mb: 3}} />
                    <Grid container spacing={3}>
                        <Grid item xs={6}><Skeleton variant="rectangular" height={48} sx={{borderRadius: 1}} /></Grid>
                        <Grid item xs={6}><Skeleton variant="rectangular" height={48} sx={{borderRadius: 1}} /></Grid>
                    </Grid>
                </Box>
            </Box>
        </Box>
    );
}

// Wrap a child block; show a centred spinner overlay while `loading` is true.
export function LoadingContainer({loading, children}: {loading?: boolean; children?: React.ReactNode}) {
    return (
        <Box sx={{position: 'relative'}}>
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
                    zIndex: 10,
                }}>
                    <CircularProgress size={32} />
                </Box>
            }
        </Box>
    );
}
