import api from '@logistics/features/api/api'
import { useGet } from '@logistics/hooks/hooks'
import type React from 'react'
import { Link } from 'react-router-dom'
import { NavMenu } from './NavMenu'

type LayoutProps = {
    children: React.ReactNode
    /** Hide the navigation menu items (keeps the brand and user/role block). */
    hideMenu?: boolean
}

type AppVersion = {
    logistics: string
    product: string
}

export const Layout = ({ children, hideMenu }: LayoutProps) => {
    const currYear = new Date().getFullYear()
    const [[versions]] = useGet<AppVersion>(`${api.meta}/version`)
    return (
        <div>
            <NavMenu hideMenu={hideMenu} />
            <div style={{ margin: '0 1rem 0 1rem' }}>
                <div style={{ minHeight: 'calc(100vh - 150px)' }}>
                    {children}
                </div>
                <footer>
                    <hr />
                    <div className="footer-meta">
                        <span>&#169; Microprojects 2020 &ndash; {currYear}</span>
                        <span className="footer-sep">·</span>
                        <span>Logistics {versions?.logistics ?? '—'}</span>
                        <span className="footer-sep">·</span>
                        <span>EDM {versions?.product ?? '—'}</span>
                        <span className="footer-sep">·</span>
                        <Link to="/changes">What's new</Link>
                    </div>
                </footer>
            </div>
        </div>
    )
}
