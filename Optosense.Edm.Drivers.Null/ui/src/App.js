import { usePluginData } from '@microprojects/react-utils';
import React, { useCallback } from 'react';
import { Route, Link } from 'react-router-dom';

function App() {
    //usePluginData()
    return (
        <div>
            {/* <Route path='/' exact>
                <>
                    <h1>Home</h1>
                    <ul>
                        <li><Link to='/'>Home</Link></li>
                        <li><Link to='/profile'>Profile editor</Link></li>
                        <li><Link to='/options'>Options editor</Link></li>
                        <li><Link to='/terminal'>Terminal</Link></li>
                    </ul>
                </>
            </Route>
            <Route path='/profile'>
                <Profile />
            </Route>
            <Route path='/options'>
                <h1>Options</h1>
            </Route>
            <Route path='/terminal'>
                <h1>Terminal</h1>
            </Route> */}
        </div>
    );
}

const Profile = () => {
    return (
        <div>
            <h6>Selected profile info</h6>
        </div>
    );
}


export default App;
