import React from 'react';
import {useRouteMatch} from "@logistics/hooks/routerHooks";
import {PageTitle} from "@logistics/components/PageTitle.tsx";
import {Nav, NavItem, NavLink} from "reactstrap";
import {NavLink as Link} from "react-router";

export function Tasks() {
    let { path } = useRouteMatch();

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <PageTitle title="Tasks" />
                <Nav pills>
                    <NavItem>
                        <NavLink tag={Link} to={`${path}/ongoing`} >Ongoing</NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink tag={Link} to={`${path}/Completed`} >Completed</NavLink>
                    </NavItem>
                </Nav>
            </div>
            <hr />
            <div>
                <span>Tasks for production</span>
            </div>
        </>
    );
}
