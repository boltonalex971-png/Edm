import React from 'react';
import { PageTitle } from '../PageTitle';

export function Apps() {

    return (
        <>
            <div>
                <PageTitle title='Applications' />
            </div>
            <hr />
            <p>Apllications are the user interfaces for controlling, monitoring and communicating with ongoing operations</p>
            <p><strong>Available apps</strong></p>
            <ul>
                <li>
                    <p>Test process. <a target='_blank' href='/app/test'>Take a look</a></p>
                </li>
                <li>
                    <p>Interesting process (under constraction)</p>
                </li>
                <li>
                    <p>Fascinating process (under construction)</p>
                </li>

            </ul>
        </>
    );
}

