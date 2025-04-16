import React from 'react';
import {useRouteMatch} from "@logistics/hooks/routerHooks";
import {PageTitle} from "@logistics/components/PageTitle.tsx";
import {Nav, NavItem, NavLink} from "reactstrap";
import {NavLink as Link} from "react-router";

export function Supplies() {
    let { path } = useRouteMatch();

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <PageTitle title="Supplies" />
                <Nav pills>
                    <NavItem>
                        <NavLink tag={Link} to={`${path}/remaining`} >Remaining</NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink tag={Link} to={`${path}/consumed`} >Consumed</NavLink>
                    </NavItem>
                </Nav>
            </div>
            <hr />
            <div>
                <span>Supplies of parts and materials</span>
            </div>
        </>
    );
}
