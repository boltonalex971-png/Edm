import React from 'react';
import { Nav, NavItem, NavLink } from 'reactstrap';
import { NavLink as Link, useRouteMatch } from 'react-router-dom';

export function PluginsMenu() {
    let { path } = useRouteMatch();
    return (
        <Nav pills>
            <NavItem>
                <NavLink tag={Link} to={`${path}/drivers`} >Drivers</NavLink>
            </NavItem>
            <NavItem>
                <NavLink tag={Link} to={`${path}/profiles`} >Profiles</NavLink>
            </NavItem>
            <NavItem>
                <NavLink tag={Link} to={`${path}/operations`} >Operations</NavLink>
            </NavItem>
        </Nav>
    );
}
