import React from 'react';
import {Skeleton} from '@mui/material';
import styles from './StateSurface.module.scss';

// HANDOFF · v2 04c.3 · canonical loading skeleton recipes. One named
// recipe per surface (grid · detail · table) so callers don't reinvent
// the placeholder shape. Each mirrors the live layout exactly so the
// page doesn't reflow when real data lands.

interface SkeletonGridProps {
    count?: number;
    className?: string;
}

/** Card-grid skeleton — for dashboard tile layouts (Operations, Workplaces). */
export function SkeletonGrid({count = 6, className}: SkeletonGridProps) {
    return (
        <div className={`${styles.skelGrid} ${className || ''}`} aria-busy="true" aria-live="polite">
            {Array.from({length: count}).map((_, i) => (
                <div key={i} className={styles.skelCard}>
                    <Skeleton variant="text" width="40%" sx={{fontSize: 11}}/>
                    <Skeleton variant="text" width="80%" sx={{fontSize: 14}}/>
                    <Skeleton variant="text" width="50%" sx={{fontSize: 11}}/>
                    <Skeleton variant="rectangular" height={24} sx={{borderRadius: 'var(--r-2)'}}/>
                </div>
            ))}
        </div>
    );
}

/** Detail-card skeleton — for Detail panel while loading. */
export function SkeletonDetail() {
    return (
        <div aria-busy="true" aria-live="polite">
            <div className={styles.skelDetailHeader}>
                <Skeleton variant="rounded" width={44} height={44}/>
                <div>
                    <Skeleton variant="text" width="40%" sx={{fontSize: 11}}/>
                    <Skeleton variant="text" width="70%" sx={{fontSize: 18}}/>
                </div>
                <Skeleton variant="rounded" width={96} height={28}/>
            </div>
            <div className={styles.skelDetailBody}>
                {Array.from({length: 4}).map((_, i) => (
                    <div key={i}>
                        <Skeleton variant="text" width="40%" sx={{fontSize: 11}}/>
                        <Skeleton variant="text" width="80%" sx={{fontSize: 14}}/>
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Data-table skeleton — for RelationTable / DataGrid while loading. */
export function SkeletonTable({rows = 5}: {rows?: number}) {
    return (
        <div aria-busy="true" aria-live="polite">
            <div className={styles.skelTableHead}>
                {Array.from({length: 4}).map((_, i) => (
                    <Skeleton key={i} variant="text" width="60%" sx={{fontSize: 11}}/>
                ))}
                <Skeleton variant="text" width={60} sx={{fontSize: 11}}/>
            </div>
            {Array.from({length: rows}).map((_, r) => (
                <div key={r} className={styles.skelTableRow}>
                    {Array.from({length: 4}).map((_, c) => (
                        <Skeleton key={c} variant="text" width={`${50 + (c * 10) % 40}%`} sx={{fontSize: 13}}/>
                    ))}
                    <Skeleton variant="rounded" width={80} height={24}/>
                </div>
            ))}
        </div>
    );
}
