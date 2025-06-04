import React, {useState} from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Options } from './Options';
import '@progress/kendo-theme-bootstrap/dist/all.scss';
//import "bootstrap/scss/bootstrap.scss";
import { ApiContext } from './ApiContext';
import { usePluginData } from '@microprojects/react-utils';

function App(props) {
    const [data, setData] = usePluginData();
    const handleOptionsChanged = (options) => {
        setData({...data, options});
    }
    
    return (
        <ApiContext.Provider value={`${process.env.REACT_APP_API_URL || window.location.origin}`}>
            <Routes>
                <Route path='/' element={
                    <>
                        <h1>Home</h1>
                        <ul>
                            <li><Link to='/plan/1'>Execution plan</Link></li>
                            <li><Link to='/options?a=eyJhcGkiOiIvYXBpL3dvcmtwbGFjZXMvcHJvY2Vzc2VzL3dvcmtiZW5jaGVzL2RldmljZXMifQ=='>Options</Link></li>
                            <li><Link to='/console'>Terminal</Link></li>
                        </ul>
                    </>}
                >
                </Route>
                <Route path='/plan/:id' element={<></>} />
                <Route path='/options' element={<Options guid={`${process.env.REACT_APP_GUID}`} data={data} onChange={handleOptionsChanged} />} />
                <Route path='/console' element={<h1>Console is in the development progress...</h1>} />
            </Routes>
        </ApiContext.Provider>

    );
}

export default App;
