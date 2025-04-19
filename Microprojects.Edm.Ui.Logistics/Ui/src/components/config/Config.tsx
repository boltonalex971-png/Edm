import React from 'react';
import { Processes } from "./process/Processes";
import {useRouteMatch} from "@logistics/hooks/routerHooks";
import {Route, Routes} from "react-router-dom";
import {PageTitle} from "@logistics/components/PageTitle";
import {Nav, NavItem, NavLink} from "reactstrap";
import {NavLink as Link} from "react-router";
import {Nomenclatures} from "@logistics/components/config/nomenclature/Nomenclatures.tsx";

export function Config() {
    let { path } = useRouteMatch();

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <PageTitle title="Configurations" />
                <Nav pills>
                    <NavItem>
                        <NavLink tag={Link} to={`${path}/processes`} >Processes</NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink tag={Link} to={`${path}/nomenclatures`} >Nomenclatures</NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink tag={Link} to={`${path}/tares`} >Tares</NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink tag={Link} to={`${path}/t-types`} >Tare types</NavLink>
                    </NavItem>
                </Nav>
            </div>
            <hr />
            <div>
                <Routes>
                    <Route index element={<p>Select one of the options above</p>} />
                    <Route path='processes/*' element={<Processes />} />
                    <Route path='nomenclatures/*' element={<Nomenclatures />} />
                    <Route path='tares' element={<span>Tares</span>} />
                    <Route path='t-types' element={<span>Tare types</span>} />
                    <Route path='*' element={<span>Page not exists</span>} />
                </Routes>
            </div>
        </>
    );
}
