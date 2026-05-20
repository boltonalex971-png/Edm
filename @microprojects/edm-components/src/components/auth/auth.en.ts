export default {
    signin: {
        title: 'Sign in to continue',
        cta: 'Sign in',
        body: 'You are not authenticated to access the {{appName}} application. Please sign in with your domain account.',
    },
    expired: {
        title: 'Your session has expired',
        cta: 'Sign in again',
        body: 'You have been signed out for inactivity. Sign in again to continue where you left off.',
    },
    noRole: {
        title: 'No role assigned',
        bodyNamed: 'User {{user}} has no role assigned in {{appName}}. Please contact your system administrator to request access.',
        bodyAnonymous: 'No role is assigned to your account. Please contact your system administrator to request access.',
    },
    forbidden: {
        title: 'Access denied',
        body: 'Your role does not grant access to this area. If you believe this is a mistake, contact your system administrator.',
    },
} as const
