import type React from 'react'
import { NavMenu } from './NavMenu'

type LayoutProps = {
    children: React.ReactNode
    /** Hide the navigation menu items (keeps the brand and user/role block). */
    hideMenu?: boolean
}

export const Layout = ({ children, hideMenu }: LayoutProps) => {
    const currYear = new Date().getFullYear()
    return (
        <div>
            <NavMenu hideMenu={hideMenu} />
            <div style={{ margin: '0 1rem 0 1rem' }}>
                <div style={{ minHeight: 'calc(100vh - 150px)' }}>
                    {children}
                </div>
                <footer>
                    <hr />
                    <p>&#169; Microprojects 2020 &ndash; {currYear}</p>
                </footer>
            </div>
        </div>
    )
}
