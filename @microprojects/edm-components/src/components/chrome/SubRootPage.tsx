import React, {useState, useEffect} from 'react';
import {NavLink, useLocation} from 'react-router-dom';

// HANDOFF · v2 04f.9 · page-head squeeze. Body scroll past SQUEEZE_ON
// collapses the chrome (.doc-crumbs 28→0 and .page-head 72→36, 180 ms ease).
// Hysteresis gap (SQUEEZE_ON − SQUEEZE_OFF) must exceed the combined height
// delta (28 + 36 = 64 px) — otherwise browser scroll-anchoring bumps scrollY
// across the threshold after each transition and the header oscillates.
const SQUEEZE_ON = 80;
const SQUEEZE_OFF = 4;

export interface SubRootPageMenuItem {
    path: string;
    label: React.ReactNode;
    icon?: React.ReactNode;
}

interface SubRootPageProps {
    title: React.ReactNode;
    menuItems: SubRootPageMenuItem[];
    children?: React.ReactNode;
}

export const SubRootPage = ({title, menuItems, children}: SubRootPageProps) => {
    const [isSqueezed, setIsSqueezed] = useState(false);
    const location = useLocation();

    useEffect(() => {
        let frameId = 0;

        const handleScroll = () => {
            if (frameId) return;
            frameId = requestAnimationFrame(() => {
                frameId = 0;
                const scrollY = window.scrollY;
                setIsSqueezed(prev => {
                    if (!prev && scrollY > SQUEEZE_ON) return true;
                    if (prev && scrollY < SQUEEZE_OFF) return false;
                    return prev;
                });
            });
        };

        window.addEventListener('scroll', handleScroll, {passive: true});
        return () => {
            if (frameId) cancelAnimationFrame(frameId);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const isPathActive = (path: string) => location.pathname.startsWith(path);

    const crumbSegments = location.pathname.replace(/^\/+/, '').split('/').filter(Boolean).slice(0, 2);

    return (
        <>
            <div
                className="doc-crumbs"
                data-sticky-header="true"
                data-squeezed={isSqueezed ? 'true' : 'false'}
            >
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
