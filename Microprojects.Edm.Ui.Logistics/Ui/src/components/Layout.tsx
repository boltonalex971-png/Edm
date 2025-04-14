import type React from "react";
import { NavMenu } from './NavMenu';

type LayoutProps = {
    children: React.ReactNode;
}

export const Layout = ({ children } : LayoutProps) => {
    const currYear = new Date().getFullYear();
    return (
        <div>
            <NavMenu />
            <div style={{ margin: '0 1rem 0 1rem' }}>
                <div style={{ minHeight: 'calc(100vh - 150px)' }} >
                    {children}
                </div>
                <footer>
                    <hr />
                    <p>&#169; Microprojects 2020 &ndash; {currYear}</p>
                </footer>
            </div>
        </div>
    );
}
