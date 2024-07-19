import React, { Component, useState } from 'react';
import { Collapse, Container, Navbar, NavbarBrand, NavbarText, NavbarToggler, NavItem, NavLink } from 'reactstrap';
import { Link } from 'react-router-dom';
import './NavMenu.css';
import { appRoles, UserContext } from '../ApiContext';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import api from './api';
import { changeRole } from '../slices/userSlice';

export const NavMenu = (props) => {
    const user = useSelector(s => s.user)
    const dispatch = useDispatch()
    const [collapsed, setCollapsed] = useState(true)
    const toggleNavbar = () => setCollapsed(s => !s)
    const setRole = (role) =>
        axios.put(`${api.auth}/user/role`, role, { headers: { 'Content-Type': 'application/json' } })
            .then(r => {
                dispatch(changeRole(r.data.role))
                // Reload to get correct data for the role
                window.location.reload()
            })
            .catch(r => alert(r))


    return (
        <header>
            <Navbar className="navbar-expand-sm navbar-toggleable-sm border-bottom box-shadow mb-3" light>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0 1rem 0 1rem', width: '100%' }}>
                    <NavbarBrand tag={Link} to="/">Optosense EDM</NavbarBrand>
                    <NavbarToggler onClick={toggleNavbar} className="mr-2" />
                    <Collapse className="d-sm-inline-flex" isOpen={!collapsed} navbar>
                        <ul className="navbar-nav flex-grow">
                            <NavItem>
                                <NavLink tag={Link} className="text-dark" to="/">Home</NavLink>
                            </NavItem>
                            {user && user.role === appRoles.operator &&
                                <>
                                    <NavItem>
                                        <NavLink tag={Link} className="text-dark" to="/dashboard/operations">Operations</NavLink>
                                    </NavItem>
                                </>
                            }
                            {user && user.role !== appRoles.operator &&
                                <>
                                    <NavItem>
                                        <NavLink tag={Link} className="text-dark" to="/dashboard/operations">Dashboard</NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink tag={Link} className="text-dark" to="/config/processes">Configurations</NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink tag={Link} className="text-dark" to="/plugins/drivers">Plugins</NavLink>
                                    </NavItem>
                                </>
                            }
                        </ul>
                    </Collapse>
                    <NavbarText className='me-2'>
                        <div>
                            {user.name}
                        </div>
                    </NavbarText>
                    <DropDownList
                        style={{ width: '150px' }}
                        data={user.roles}
                        value={user.role}
                        onChange={(e) => setRole(e.value)}
                    />
                </div>
            </Navbar>
        </header>
    );
}
