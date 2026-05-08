import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link as RouterLink } from 'react-router-dom';
import { NavMenu } from './NavMenu';
import api from './api';

export const Layout = ({ children }) => {
    const currYear = new Date().getFullYear();
    const [versions, setVersions] = useState(null);

    useEffect(() => {
        const controller = new AbortController();
        fetch(`${api.meta}/version`, { credentials: 'include', signal: controller.signal })
            .then((r) => (r.ok ? r.json() : null))
            .then((v) => v && setVersions(v))
            .catch(() => { /* leave dashes if unavailable */ });
        return () => controller.abort();
    }, []);

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
                    <RouterLink to="/changes" className="footer-link">What's new</RouterLink>
                </div>
            </footer>
        </>
    );
};

Layout.propTypes = {
    children: PropTypes.any
};
