import React from 'react';
import {Box, Typography, Button} from '@mui/material';
import {
    LockOutlined as LockIcon,
    PersonOffOutlined as NoRoleIcon,
    BlockOutlined as ForbiddenIcon,
    LoginOutlined as LoginIcon,
} from '@mui/icons-material';
import {useTranslation} from 'react-i18next';

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
    titleKey: string;
    titleFallback: string;
    soft: string;
    deep: string;
    ctaKey?: string;
    ctaFallback?: string;
}

const CHROME: Record<InterstitialKind, InterstitialChrome> = {
    signin: {
        Icon: LoginIcon,
        titleKey: 'signin.title',
        titleFallback: 'Sign in to continue',
        soft: 'var(--accent-soft)',
        deep: 'var(--accent-deep)',
        ctaKey: 'signin.cta',
        ctaFallback: 'Sign in',
    },
    expired: {
        Icon: LockIcon,
        titleKey: 'expired.title',
        titleFallback: 'Your session has expired',
        soft: 'var(--sig-warn-soft)',
        deep: 'var(--sig-warn-deep)',
        ctaKey: 'expired.cta',
        ctaFallback: 'Sign in again',
    },
    'no-role': {
        Icon: NoRoleIcon,
        titleKey: 'noRole.title',
        titleFallback: 'No role assigned',
        soft: 'var(--surface-2)',
        deep: 'var(--ink-2)',
    },
    forbidden: {
        Icon: ForbiddenIcon,
        titleKey: 'forbidden.title',
        titleFallback: 'Access denied',
        soft: 'var(--sig-fault-soft)',
        deep: 'var(--sig-fault-deep)',
    },
};

function useBodyCopy() {
    const {t} = useTranslation('edm-auth');
    return (kind: InterstitialKind, user?: string, appName: string = 'EDM'): string => {
        switch (kind) {
            case 'signin':
                return t('signin.body', 'You are not authenticated to access the {{appName}} application. Please sign in with your domain account.', {appName});
            case 'expired':
                return t('expired.body', 'You have been signed out for inactivity. Sign in again to continue where you left off.');
            case 'no-role':
                return user
                    ? t('noRole.bodyNamed', 'User {{user}} has no role assigned in {{appName}}. Please contact your system administrator to request access.', {user, appName})
                    : t('noRole.bodyAnonymous', 'No role is assigned to your account. Please contact your system administrator to request access.');
            case 'forbidden':
                return t('forbidden.body', 'Your role does not grant access to this area. If you believe this is a mistake, contact your system administrator.');
        }
    };
}

export function AuthInterstitial({kind, user, onAction, appName}: AuthInterstitialProps) {
    const {t} = useTranslation('edm-auth');
    const bodyCopy = useBodyCopy();
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
                {t(chrome.titleKey, chrome.titleFallback)}
            </Typography>
            <Typography
                variant="body1"
                sx={{color: 'var(--ink-3)', maxWidth: 480, lineHeight: 1.6}}
            >
                {bodyCopy(kind, user, appName)}
            </Typography>
            {chrome.ctaKey && chrome.ctaFallback && onAction && (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={onAction}
                    sx={{mt: 2}}
                >
                    {t(chrome.ctaKey, chrome.ctaFallback)}
                </Button>
            )}
        </Box>
    );
}
