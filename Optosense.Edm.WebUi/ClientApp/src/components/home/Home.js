import React from 'react';
import { PageTitle } from '../PageTitle';
import { Link, NavLink } from 'react-router-dom';

export function Home() {

    return (
        <div style={{ width: '100%', height:'50vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div>
                <div>
                    <PageTitle title='Welcome to Optosense ISTP 2 solution' />
                </div>
                <hr />
                <p>
                    ISTP 2 is an enterprise data management system, dedicated to collect and analyze data <br />
                    from any industrial process running in the company</p>
                <p>
                    <strong>You can</strong>
                </p>
                <ul>
                    <li>
                        <p>launch an operation: <NavLink tag={Link} to='/operation'>Start operation</NavLink></p>
                    </li>
                    <li>
                        <p>check current operational status with dashboard: <NavLink tag={Link} to='/dashboard'>Go to dashboard</NavLink></p>
                    </li>
                    <li>
                        <p>configure production environment: <NavLink tag={Link} to='/config'>Go to configurations</NavLink></p>
                    </li>

                </ul>
            </div>
        </div>
    );
}

