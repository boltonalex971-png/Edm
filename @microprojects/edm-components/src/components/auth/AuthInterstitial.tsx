import React from 'react';
import {Box, Typography, Button} from '@mui/material';
import {
    LockOutlined as LockIcon,
    PersonOffOutlined as NoRoleIcon,
    BlockOutlined as ForbiddenIcon,
    LoginOutlined as LoginIcon,
} from '@mui/icons-material';

// HANDOFF · v2 04e.3-5 · auth interstitials. One layout, four severities.
// Icon-in-circle on a tinted disc, title in the matching deep tone, body
// muted to ink-3, optional CTA.

export type InterstitialKind = 'signin' | 'expired' | 'no-role' | 'forbidden';

interface AuthInterstitialProps {
    kind: InterstitialKind;
    user?: string;
    onAction?: () => void;
    /** Application name used in the signin body copy (defaults to "EDM"). */
    appName?: string;
}

interface InterstitialChrome {
    Icon: React.ComponentType<{sx?: object}>;
    title: string;
    soft: string;
    deep: string;
    cta?: string;
}

const CHROME: Record<InterstitialKind, InterstitialChrome> = {
    signin: {
        Icon: LoginIcon,
        title: 'Sign in to continue',
        soft: 'var(--accent-soft)',
        deep: 'var(--accent-deep)',
        cta: 'Sign in',
    },
    expired: {
        Icon: LockIcon,
        title: 'Your session has expired',
        soft: 'var(--sig-warn-soft)',
        deep: 'var(--sig-warn-deep)',
        cta: 'Sign in again',
    },
    'no-role': {
        Icon: NoRoleIcon,
        title: 'No role assigned',
        soft: 'var(--surface-2)',
        deep: 'var(--ink-2)',
    },
    forbidden: {
        Icon: ForbiddenIcon,
        title: 'Access denied',
        soft: 'var(--sig-fault-soft)',
        deep: 'var(--sig-fault-deep)',
    },
};

const BODY_COPY: Record<InterstitialKind, (user?: string, appName?: string) => string> = {
    signin: (_user, appName = 'EDM') => `You are not authenticated to access the ${appName} application. Please sign in with your domain account.`,
    expired: () => 'You have been signed out for inactivity. Sign in again to continue where you left off.',
    'no-role': (user, appName = 'EDM') => `${user ? `User ${user} has no role assigned in ${appName}. ` : 'No role is assigned to your account. '}Please contact your system administrator to request access.`,
    forbidden: () => 'Your role does not grant access to this area. If you believe this is a mistake, contact your system administrator.',
};

export function AuthInterstitial({kind, user, onAction, appName}: AuthInterstitialProps) {
    const chrome = CHROME[kind];
    const Icon = chrome.Icon;

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: 6,
                minHeight: 'calc(100vh - 56px - 36px)',
                gap: 2,
            }}
        >
            <Box
                sx={{
                    width: 96,
                    height: 96,
                    borderRadius: '50%',
                    background: chrome.soft,
                    color: chrome.deep,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 1,
                }}
            >
                <Icon sx={{fontSize: 44}} />
            </Box>
            <Typography
                variant="h4"
                sx={{fontWeight: 700, color: chrome.deep, letterSpacing: '-0.01em'}}
            >
                {chrome.title}
            </Typography>
            <Typography
                variant="body1"
                sx={{color: 'var(--ink-3)', maxWidth: 480, lineHeight: 1.6}}
            >
                {BODY_COPY[kind](user, appName)}
            </Typography>
            {chrome.cta && onAction && (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={onAction}
                    sx={{mt: 2}}
                >
                    {chrome.cta}
                </Button>
            )}
        </Box>
    );
}
