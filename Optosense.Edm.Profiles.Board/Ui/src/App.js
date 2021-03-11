import React from 'react';
import { Route, Link } from 'react-router-dom';
import { Instructions } from './components/config/Instructions';
import { Profile } from './components/editor/Profile';
import 'bootstrap/scss/bootstrap.scss';
import '@progress/kendo-theme-bootstrap/dist/all.scss';
import { ApiContext } from './ApiContext';

function App(props) {
    return (
        <ApiContext.Provider value={`${process.env.REACT_APP_API_URL || window.location.origin}/api`}>
            <div>
                <Route path='/' exact>
                    <>
                        <h1>Home</h1>
                        <ul>
                            <li><Link to='/'>Home</Link></li>
                            <li><Link to='/profile/0'>Profile editor</Link></li>
                            <li><Link to='/config'>Configuration</Link></li>
                            <li><Link to='/terminal'>Terminal</Link></li>
                        </ul>
                    </>
                </Route>
                <Route path='/profile/:id'>
                    <Profile {...props} />
                </Route>
                <Route path='/config'>
                    <Instructions guid={`${process.env.REACT_APP_GUID}`} />
                </Route>
                <Route path='/terminal'>
                    <Link to='/'>Home</Link>
                    <h1>Terminal</h1>
                </Route>
            </div>
        </ApiContext.Provider>

    );
}



export default App;
