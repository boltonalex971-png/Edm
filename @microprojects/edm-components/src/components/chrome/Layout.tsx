import React, {useEffect, useState} from 'react';
import {Link as RouterLink, useLocation} from 'react-router-dom';

interface LayoutProps {
    children: React.ReactNode;
    /** The header chrome — typically a NavMenu instance. */
    navMenu: React.ReactNode;
    /** API URL returning `{ main: string, product: string }`. Omit to skip version fetch. */
    versionsApiUrl?: string;
    /** Path for the "What's new" link. Defaults to `/changes`. */
    changelogPath?: string;
    /** localStorage key for the version-seen marker. Defaults to `edm.changelog.seen`. */
    seenStorageKey?: string;
    /** Footer copyright owner; defaults to `Microprojects`. */
    copyrightOwner?: string;
    /** Footer copyright start year; defaults to 2020. */
    copyrightStartYear?: number;
}

interface VersionInfo {
    main?: string;
    product?: string;
}

export const Layout = ({
    children,
    navMenu,
    versionsApiUrl,
    changelogPath = '/changes',
    seenStorageKey = 'edm.changelog.seen',
    copyrightOwner = 'Microprojects',
    copyrightStartYear = 2020,
}: LayoutProps) => {
    const currYear = new Date().getFullYear();
    const [versions, setVersions] = useState<VersionInfo | null>(null);
    const [seenVersion, setSeenVersion] = useState<string>(() => {
        try { return localStorage.getItem(seenStorageKey) || ''; } catch { return ''; }
    });
    const location = useLocation();

    useEffect(() => {
        if (!versionsApiUrl) return;
        const controller = new AbortController();
        fetch(versionsApiUrl, {credentials: 'include', signal: controller.signal})
            .then((r) => (r.ok ? r.json() : null))
            .then((v) => v && setVersions(v))
            .catch(() => { /* leave dashes if unavailable */ });
        return () => controller.abort();
    }, [versionsApiUrl]);

    /* HANDOFF · v2 chrome.html footer · "What's new" nudge. Compare the
       latest backend `main` version against the version the user has
       previously seen (localStorage). On visit to changelogPath mark seen. */
    useEffect(() => {
        if (location.pathname.startsWith(changelogPath) && versions?.main && versions.main !== seenVersion) {
            try { localStorage.setItem(seenStorageKey, versions.main); } catch { /* ignore */ }
            setSeenVersion(versions.main);
        }
    }, [location.pathname, versions?.main, seenVersion, changelogPath, seenStorageKey]);

    const hasNudge = !!(versions?.main && versions.main !== seenVersion);

    return (
        <>
            {navMenu}

            <main className="page-main">
                {children}
            </main>

            <footer className="page-footer">
                <div className="footer-left">
                    <span>&copy; {copyrightOwner} {copyrightStartYear} &ndash; {currYear}</span>
                </div>
                <div className="footer-right">
                    <span className="version-chip">Main {versions?.main ?? '—'}</span>
                    <span className="version-chip">EDM {versions?.product ?? '—'}</span>
                    <RouterLink
                        to={changelogPath}
                        className={`footer-link ${hasNudge ? 'has-nudge' : ''}`}
                        title={hasNudge ? `Updated to ${versions?.main}` : undefined}
                    >
                        What's new
                        {hasNudge && <span className="nudge-dot" aria-hidden="true" />}
                    </RouterLink>
                </div>
            </footer>
        </>
    );
};
