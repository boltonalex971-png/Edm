import { PageTitle } from '@logistics/components/PageTitle'
import { Nomenclatures } from '@logistics/components/config/nomenclature/Nomenclatures.tsx'
import { TareTypes } from '@logistics/components/config/taretype/TareTypes.tsx'
import {
    MANUFACTURING,
    OPERATION,
    TECHNOLOGY,
} from '@logistics/data/processKinds'
import { useRouteMatch } from '@logistics/hooks/routerHooks'
import React from 'react'
import { NavLink as Link } from 'react-router'
import { Route, Routes } from 'react-router-dom'
import { Nav, NavItem, NavLink } from 'reactstrap'
import { Processes } from './process/Processes'

export function Config() {
    const { path } = useRouteMatch()

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <PageTitle title="Configurations" />
                <Nav pills>
                    <NavItem>
                        <NavLink tag={Link} to={`${path}/manufacturing`}>
                            Manufacturing
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink tag={Link} to={`${path}/technology`}>
                            Technology
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink tag={Link} to={`${path}/operations`}>
                            Operations
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink tag={Link} to={`${path}/nomenclatures`}>
                            Nomenclatures
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink tag={Link} to={`${path}/taretypes`}>
                            Tare types
                        </NavLink>
                    </NavItem>
                </Nav>
            </div>
            <hr />
            <div>
                <Routes>
                    <Route
                        index
                        element={<p>Select one of the options above</p>}
                    />
                    <Route
                        path="manufacturing/*"
                        element={<Processes kind={MANUFACTURING} />}
                    />
                    <Route
                        path="technology/*"
                        element={<Processes kind={TECHNOLOGY} />}
                    />
                    <Route
                        path="operations/*"
                        element={<Processes kind={OPERATION} />}
                    />
                    <Route path="nomenclatures/*" element={<Nomenclatures />} />
                    <Route path="taretypes/*" element={<TareTypes />} />
                    <Route path="*" element={<span>Page not exists</span>} />
                </Routes>
            </div>
        </>
    )
}
