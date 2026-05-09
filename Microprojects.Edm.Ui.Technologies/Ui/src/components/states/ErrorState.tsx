import React from 'react';
import {
    ErrorOutline as ErrorIcon,
    Refresh as RefreshIcon,
    ArrowBack as BackIcon,
} from '@mui/icons-material';
import {Button} from '@mui/material';
import styles from './StateSurface.module.scss';

// HANDOFF · v2 04c.3 · canonical error state.
// Icon-in-circle on --sig-fault-soft, fault-deep title, optional retry/
// back CTAs, optional mono error code chip. Same three sizes as
// EmptyState so it sits naturally inside cards or full pages.

type Size = 'sm' | 'md' | 'lg';

interface ErrorStateProps {
    title?: string;
    message?: React.ReactNode;
    code?: string;
    onRetry?: () => void;
    onBack?: () => void;
    size?: Size;
    className?: string;
}

export function ErrorState({
    title,
    message,
    code,
    onRetry,
    onBack,
    size = 'md',
    className,
}: ErrorStateProps) {
    return (
        <div className={`${styles.surface} ${styles.fault} ${styles[size]} ${className || ''}`}>
            <div className={styles.icon}>
                <ErrorIcon />
            </div>
            <h3 className={styles.title}>{title || 'Something went wrong'}</h3>
            {message && <p className={styles.help}>{message}</p>}
            {code && <span className={styles.codeChip}>Error code: {code}</span>}
            {(onRetry || onBack) && (
                <div className={styles.actions}>
                    {onRetry && (
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<RefreshIcon />}
                            onClick={onRetry}
                        >
                            Try again
                        </Button>
                    )}
                    {onBack && (
                        <Button
                            variant="outlined"
                            startIcon={<BackIcon />}
                            onClick={onBack}
                        >
                            Go back
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}

/* ErrorStub kept as a thin shim for legacy callers. Old API (error/code/
   onRefresh/onBack) maps onto the new ErrorState surface. */
export function ErrorStub({error, code, onRefresh, onBack}: {
    error?: React.ReactNode;
    code?: string;
    onRefresh?: () => void;
    onBack?: () => void;
}) {
    return (
        <ErrorState
            size="lg"
            title="Failed to load data"
            message={error || "We couldn't load the requested information. This might be due to a network issue or the item may no longer exist."}
            code={code}
            onRetry={onRefresh}
            onBack={onBack}
        />
    );
}
