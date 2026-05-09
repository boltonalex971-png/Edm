import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';

// HANDOFF · v2 04c.3 · toast surface. Snackbar-style notification with a
// 4 px left rail tinted by signal severity. Auto-dismisses after 5 s by
// default; persistent toasts (severity 'error') stay until acknowledged.

export type ToastSeverity = 'success' | 'info' | 'warning' | 'error';

export interface ToastInput {
    message: string;
    severity?: ToastSeverity;
    autoHideMs?: number | null;
}

interface ToastState extends Required<Pick<ToastInput, 'message' | 'severity'>> {
    autoHideMs: number | null;
    key: number;
}

interface ToastContextValue {
    show: (toast: ToastInput) => void;
    success: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
    error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toast, setToast] = useState<ToastState | null>(null);

    const show = useCallback((input: ToastInput) => {
        const severity = input.severity ?? 'info';
        const autoHideMs = input.autoHideMs === undefined
            ? (severity === 'error' ? null : 5000)
            : input.autoHideMs;
        setToast({ message: input.message, severity, autoHideMs, key: Date.now() });
    }, []);

    const value = useMemo<ToastContextValue>(() => ({
        show,
        success: (message) => show({ message, severity: 'success' }),
        info: (message) => show({ message, severity: 'info' }),
        warning: (message) => show({ message, severity: 'warning' }),
        error: (message) => show({ message, severity: 'error' }),
    }), [show]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <Snackbar
                key={toast?.key}
                open={!!toast}
                autoHideDuration={toast?.autoHideMs ?? null}
                onClose={(_, reason) => {
                    if (reason === 'clickaway') return;
                    setToast(null);
                }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                {toast ? (
                    <Alert
                        severity={toast.severity}
                        variant="standard"
                        onClose={() => setToast(null)}
                        sx={{ borderLeft: '4px solid', borderLeftColor: toastRailColor(toast.severity), minWidth: 280 }}
                    >
                        {toast.message}
                    </Alert>
                ) : undefined}
            </Snackbar>
        </ToastContext.Provider>
    );
}

function toastRailColor(severity: ToastSeverity): string {
    switch (severity) {
        case 'success': return 'var(--sig-run)';
        case 'warning': return 'var(--sig-warn)';
        case 'error': return 'var(--sig-fault)';
        case 'info':
        default: return 'var(--sig-info)';
    }
}

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        // Outside the provider — fall back to console so callers don't crash
        // and we still surface the message. Keeps the hook safe in tests.
        return {
            show: (t) => console.warn('[toast]', t.severity ?? 'info', t.message),
            success: (m) => console.info('[toast:success]', m),
            info: (m) => console.info('[toast:info]', m),
            warning: (m) => console.warn('[toast:warning]', m),
            error: (m) => console.error('[toast:error]', m),
        };
    }
    return ctx;
}
