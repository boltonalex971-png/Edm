import React from 'react';
import { PageTitle } from '../PageTitle';
import { Link, NavLink } from 'react-router-dom';

export function Home() {

    return (
        <>
            <div>
                <PageTitle title='Welcome to Americana' />
            </div>
            <hr />
            <p>Please make your selection followed by the pound sign now <sup><a href='https://youtu.be/yQs86zeAyS0'>*</a></sup></p>
            <p><strong>You can</strong></p>
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
        </>
    );
}

