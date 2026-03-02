import {useState} from 'react'
import {Collapse, Navbar, NavbarBrand, NavbarText, NavbarToggler, NavItem, NavLink} from 'reactstrap'
import {Link} from 'react-router-dom'
import './NavMenu.css'
import {useSelector} from "react-redux";
import {RootState} from "../store";
import {Bookshelf, Box2, Gear, House, ListTask} from "react-bootstrap-icons";
import logo from '../../public/applogo.svg'
import { DropDownList } from '@progress/kendo-react-dropdowns';
import axios from 'axios';
import api from '../features/api/api';

export const NavMenu = () => {
    const user = useSelector((state : RootState) => state.user)
    const [collapsed, setCollapsed] = useState(true)
    const toggleNavbar = () => setCollapsed(s => !s)

    const setRole = (role: string) => {
        axios.put(`${api.auth}/user/role`, JSON.stringify(role), { 
            headers: { 'Content-Type': 'application/json' } 
        })
        .then(() => {
            // Reload to get correct data for the role from the cookie set by the server
            window.location.reload();
        })
        .catch(err => alert(err.response?.data?.detail || err.message));
    };

    return (
        <header>
            <Navbar className="navbar-expand-sm navbar-toggleable-sm border-bottom box-shadow mb-3" light>
                <div style={{display: 'flex', justifyContent: 'space-between', margin: '0 1rem 0 1rem', width: '100%'}}>
                    <NavbarBrand tag={Link} to="/">
                        <img src={logo} alt={'EDμ'} />&nbsp;Logistics
                    </NavbarBrand>
                    <NavbarToggler onClick={toggleNavbar} className="mr-2"/>
                    <Collapse className="d-sm-inline-flex" isOpen={!collapsed} navbar>
                        <ul className="navbar-nav flex-grow">
                            <NavItem>
                                <NavLink tag={Link} className="text-dark" to="/">
                                    <House />&nbsp;Home
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink tag={Link} className="text-dark" to="/orders/ongoing">
                                    <ListTask/>&nbsp;Orders
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink tag={Link} className="text-dark" to="/items/remaining">
                                    <Box2/>&nbsp;Supplies
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink tag={Link} className="text-dark" to="/warehouse">
                                    <Bookshelf/>&nbsp;Warehouse
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink tag={Link} className="text-dark" to="/config/processes">
                                    <Gear/>&nbsp;Settings
                                </NavLink>
                            </NavItem>
                        </ul>
                    </Collapse>
                    <NavbarText className='me-2'>
                        <div>
                            {user?.name}
                        </div>
                    </NavbarText>
                    {user?.roles && user.roles.length > 1 && (
                        <DropDownList
                            style={{ width: '150px' }}
                            data={user.roles}
                            value={user.role}
                            onChange={(e) => setRole(e.value)}
                        />
                    )}
                </div>
            </Navbar>
        </header>
    );
}
