import React from 'react';
import { Route, Link } from 'react-router-dom';
import { Options } from './components/Options';
import 'bootstrap/scss/bootstrap.scss';
import '@progress/kendo-theme-bootstrap/dist/all.scss';
import { ApiContext } from './ApiContext';

function App(props) {
    return (
        <ApiContext.Provider value={`${process.env.REACT_APP_API_URL || window.location.origin}`}>
            <div>
                <Route path='/' exact>
                    <>
                        <h1>Home</h1>
                        <ul>
                            <li><Link to='/plan'>Execution plan</Link></li>
                            <li><Link to='/options?a=eyJhcGkiOiIvYXBpL3dvcmtwbGFjZXMvcHJvY2Vzc2VzL3dvcmtiZW5jaGVzL2RldmljZXMifQ=='>Options</Link></li>
                            <li><Link to='/console'>Terminal</Link></li>
                        </ul>
                    </>
                </Route>
                <Route path='/plan/:id'>
                </Route>
                <Route path='/options'>
                    <Options guid={`${process.env.REACT_APP_GUID}`} />
                </Route>
                <Route path='/console'>
                    <h1>Console is in the development progress...</h1>
                </Route>
            </div>
        </ApiContext.Provider>

    );
}



export default App;
