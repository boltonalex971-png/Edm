import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

export const SubRootPage = ({ title, menuItems, children }) => {
    const [isDense, setIsDense] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            setIsDense(prev => {
                if (!prev && scrollY > 25) return true;
                if (prev && scrollY < 10) return false;
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
            <header className="doc-sub" data-sticky-header="true" data-dense={isDense ? 'true' : 'false'}>
                {crumbSegments.length > 0 && (
                    <div className="sub-crumbs">/ {crumbSegments.join(' / ')}</div>
                )}
                <div className="sub-row">
                    <h2 className="sub-title">{title}</h2>
                    <nav className="scheme-tabs">
                        {menuItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={`tab ${isPathActive(item.path) ? 'active' : ''}`}
                            >
                                {item.icon}
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>
                </div>
            </header>
            <div className="doc-body">
                {children}
            </div>
        </>
    );
};

export default SubRootPage;
