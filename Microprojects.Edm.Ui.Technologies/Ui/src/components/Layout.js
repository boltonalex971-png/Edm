import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { NavMenu } from './NavMenu';
import api from './api';

const SEEN_KEY = 'edm.changelog.seen';

export const Layout = ({ children }) => {
    const currYear = new Date().getFullYear();
    const [versions, setVersions] = useState(null);
    const [seenVersion, setSeenVersion] = useState(() => {
        try { return localStorage.getItem(SEEN_KEY) || ''; } catch { return ''; }
    });
    const location = useLocation();

    useEffect(() => {
        const controller = new AbortController();
        fetch(`${api.meta}/version`, { credentials: 'include', signal: controller.signal })
            .then((r) => (r.ok ? r.json() : null))
            .then((v) => v && setVersions(v))
            .catch(() => { /* leave dashes if unavailable */ });
        return () => controller.abort();
    }, []);

    /* HANDOFF · v2 chrome.html footer · "What's new" nudge. Compare the
       latest backend `main` version against the version the user has
       previously seen (localStorage). On visit to /changes mark seen. */
    useEffect(() => {
        if (location.pathname.startsWith('/changes') && versions?.main && versions.main !== seenVersion) {
            try { localStorage.setItem(SEEN_KEY, versions.main); } catch { /* ignore */ }
            setSeenVersion(versions.main);
        }
    }, [location.pathname, versions?.main, seenVersion]);

    const hasNudge = !!(versions?.main && versions.main !== seenVersion);

    return (
        <>
            <NavMenu />

            <main className="page-main">
                {children}
            </main>

            <footer className="page-footer">
                <div className="footer-left">
                    <span>&copy; Microprojects 2020 &ndash; {currYear}</span>
                </div>
                <div className="footer-right">
                    <span className="version-chip">Main {versions?.main ?? '—'}</span>
                    <span className="version-chip">EDM {versions?.product ?? '—'}</span>
                    <RouterLink
                        to="/changes"
                        className={`footer-link ${hasNudge ? 'has-nudge' : ''}`}
                        title={hasNudge ? `Updated to ${versions.main}` : undefined}
                    >
                        What's new
                        {hasNudge && <span className="nudge-dot" aria-hidden="true" />}
                    </RouterLink>
                </div>
            </footer>
        </>
    );
};

Layout.propTypes = {
    children: PropTypes.any
};
