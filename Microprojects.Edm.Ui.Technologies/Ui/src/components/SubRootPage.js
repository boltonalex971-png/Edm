import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

// HANDOFF · v2 04f.9 · page-head squeeze. Body scroll past 12 px collapses
// the title from 28 → 16 px (height 72 → 48 px), 180 ms cubic-bezier easing.
// Hysteresis at 4 px on the way back up to avoid flicker at the threshold.
const SQUEEZE_ON = 12;
const SQUEEZE_OFF = 4;

export const SubRootPage = ({ title, menuItems, children }) => {
    const [isSqueezed, setIsSqueezed] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            setIsSqueezed(prev => {
                if (!prev && scrollY > SQUEEZE_ON) return true;
                if (prev && scrollY < SQUEEZE_OFF) return false;
                return prev;
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isPathActive = (path) => location.pathname.startsWith(path);

    const crumbSegments = location.pathname.replace(/^\/+/, '').split('/').filter(Boolean).slice(0, 2);

    return (
        <>
            <div className="doc-crumbs" data-sticky-header="true">
                <span className="sep">/</span>
                {crumbSegments.length === 0
                    ? <span>Home</span>
                    : crumbSegments.map((seg, i) => (
                        <React.Fragment key={`${i}-${seg}`}>
                            {i > 0 && <span className="sep">/</span>}
                            <span>{seg}</span>
                        </React.Fragment>
                    ))}
            </div>
            <header
                className="page-head"
                data-sticky-header="true"
                data-squeezed={isSqueezed ? 'true' : 'false'}
            >
                <h1 className="ph-title">{title}</h1>
                <nav className="ph-tabs">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={isPathActive(item.path) ? 'active' : ''}
                        >
                            {item.icon}
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </header>
            <div className="doc-body">
                {children}
            </div>
        </>
    );
};

export default SubRootPage;
