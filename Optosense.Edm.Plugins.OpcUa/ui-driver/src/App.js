import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Options } from './components/Options';
import '@progress/kendo-theme-bootstrap/dist/all.scss';
//import "bootstrap/scss/bootstrap.scss";
import { ApiContext } from './Contexts';
import { usePluginData } from '@microprojects/react-utils'

function App(props) {
    const [data] = usePluginData()
    return (
        <ApiContext.Provider value={`${process.env.REACT_APP_API_URL || window.location.origin}/api/opcua`}>
            <Routes>
                <Route path='/' element={
                    <>
                        <h1>Home</h1>
                        <ul>
                            <li><Link to='/plan/1'>Profile</Link></li>
                            <li><Link to='/options?a=%7B%22api%22%3A%22http%3A%2F%2Flocalhost%3A16331%2Fapi%2Fworkplaces%2Fprocesses%2Fworkbenches%2Fdevices%2F37%22%2C%22options%22%3A%7B%22endpoint%22%3A%22opc.tcp%3A%2F%2Flocalhost%3A51210%2FUA%2FSampleServer+%22%2C%22output%22%3A%5B%7B%22text%22%3A%22WaterTemperature%22%2C%22value%22%3A%22ns=4%3Bi%3D1244%22%7D%2C%7B%22text%22%3A%22AirTemperature%22%2C%22value%22%3A%22ns%3D4%3Bi%3D1267%22%7D%2C%7B%22text%22%3A%22Humidity%22%2C%22value%22%3A%22ns%3D4%3Bi%3D1259%22%7D%5D%7D%2C%22output%22%3A%5B%22WaterTemperature%22%2C%22AirTemperature%22%2C%22Humidity%22%2C%22SomeNew%22%5D%7D'>Options</Link></li>
                            <li><Link to='/console'>Terminal</Link></li>
                        </ul>
                    </>}
                >
                </Route>
                <Route path='/plan/:id' element={<></>} />
                <Route path='/options' element={<Options data={data} />} />
                <Route path='/console' element={<h1>Console is in the development progress...</h1>} />
            </Routes>
        </ApiContext.Provider>

    );
}

export default App;
