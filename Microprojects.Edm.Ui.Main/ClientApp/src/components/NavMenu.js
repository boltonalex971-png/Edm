import React, { Component } from 'react';
import { Collapse, Container, Navbar, NavbarBrand, NavbarText, NavbarToggler, NavItem, NavLink } from 'reactstrap';
import { Link } from 'react-router-dom';
import './NavMenu.css';
import { appRoles, UserContext } from '../ApiContext';
import { DropDownList } from '@progress/kendo-react-dropdowns';

export class NavMenu extends Component {

    constructor(props) {
        super(props);

        this.toggleNavbar = this.toggleNavbar.bind(this);
        this.state = {
            collapsed: true
        };
    }

    toggleNavbar() {
        this.setState({
            collapsed: !this.state.collapsed
        });
    }

    render() {
        return (
            <header>
                <Navbar className="navbar-expand-sm navbar-toggleable-sm border-bottom box-shadow mb-3" light>
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0 1rem 0 1rem', width: '100%' }}>
                        <NavbarBrand tag={Link} to="/">Optosense EDM</NavbarBrand>
                        <UserContext.Consumer>
                            {user => user &&
                                <>
                                    <NavbarToggler onClick={this.toggleNavbar} className="mr-2" />
                                    <Collapse className="d-sm-inline-flex" isOpen={!this.state.collapsed} navbar>
                                        <ul className="navbar-nav flex-grow">
                                            <NavItem>
                                                <NavLink tag={Link} className="text-dark" to="/">Home</NavLink>
                                            </NavItem>
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
                                        onChange={(e) => user.setRole(e.value)}
                                    />
                                </>
                            }
                        </UserContext.Consumer>
                    </div>
                </Navbar>
            </header>
        );
    }
}
