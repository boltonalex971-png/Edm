import React from 'react';
import { Nav, NavItem, NavLink } from 'reactstrap';
import { NavLink as Link, useRouteMatch } from 'react-router-dom';

export function DashboardMenu() {
    let { path } = useRouteMatch();
    return (
        <Nav pills>
            <NavItem>
                <NavLink tag={Link} to={`${path}/operations`} >Operations</NavLink>
            </NavItem>
            <NavItem>
                <NavLink tag={Link} to={`${path}/workplaces`} >Workplaces</NavLink>
            </NavItem>
            <NavItem>
                <NavLink tag={Link} to={`${path}/users`} >Users</NavLink>
            </NavItem>
            <NavItem>
                <NavLink tag={Link} to={`${path}/schedule`} >Schedule</NavLink>
            </NavItem>
        </Nav>
    );
}
