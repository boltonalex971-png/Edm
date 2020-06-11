import React from 'react';
import { Nav, NavItem, NavLink } from 'reactstrap';
import { NavLink as Link, useRouteMatch } from 'react-router-dom';
import './ConfigMenu.css';

export function ConfigMenu() {
    let { path } = useRouteMatch();
    return (
        <Nav pills>
            <NavItem>
                <NavLink tag={Link} to={`${path}/processes`} >Processes</NavLink>
            </NavItem>
            <NavItem>
                <NavLink tag={Link} to={`${path}/workplaces`} >Workplaces</NavLink>
            </NavItem>
            <NavItem>
                <NavLink tag={Link} to={`${path}/hosts`} >Hosts</NavLink>
            </NavItem>
            <NavItem>
                <NavLink tag={Link} to={`${path}/devices`} >Devices</NavLink>
            </NavItem>
        </Nav>
    );
}
