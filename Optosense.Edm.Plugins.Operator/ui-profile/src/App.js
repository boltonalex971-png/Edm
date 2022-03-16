import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Profile } from './components/Profile';
import '@progress/kendo-theme-bootstrap/dist/all.scss';
import { ApiContext } from './ApiContext';

function App(props) {
    return (
        <ApiContext.Provider value={`${process.env.REACT_APP_API_URL || window.location.origin}/api`}>
            <div>
                <Routes>
                    <Route path='/' element={
                        <>
                            <h1>Home</h1>
                            <ul>
                                <li><Link to='/'>Home</Link></li>
                                <li><Link to='/profile/0'>Profile editor</Link></li>
                                <li><Link to='/config'>Configuration</Link></li>
                                <li><Link to='/terminal'>Terminal</Link></li>
                            </ul>
                        </>
                    } />
                    <Route path='/profile/:id' element={
                        <Profile {...props} />
                    } />
                    <Route path='/terminal' element={
                        <>
                            <Link to='/'>Home</Link>
                            <h1>Terminal</h1>
                        </>
                    } />
                </Routes>
            </div>
        </ApiContext.Provider>

    );
}



export default App;
