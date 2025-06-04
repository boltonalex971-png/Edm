import React, {useState} from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Options } from './components/Options';
import '@progress/kendo-theme-bootstrap/dist/all.scss';
//import "bootstrap/scss/bootstrap.scss";
import { ApiContext } from './Contexts';
import { usePluginData } from '@microprojects/react-utils'

function App(props) {
    const [data, setData] = usePluginData()
    const handleOptionsChanged = (options) => {
        setData({...data, options});
    }
    // const [data,  setData] = useState({
    //     output: ['111', '222', '333', 'qqq'],
    //     options: {
    //         output: [{text: '111', value: null}, {text: '222', value: null}, {text: '333', value: null},{text: '444'}],
    //         endpoint: 'qqq'
    //     }
    // })

    return (
        <ApiContext.Provider value={`${process.env.REACT_APP_API_URL || window.location.origin}/api/opcua`}>
            <Routes>
                <Route path='/' element={
                    <>
                        <h1>Home</h1>
                        <ul>
                            <li><Link to='/plan/1'>Profile</Link></li>
                            <li><Link to='/options'>Options</Link></li>
                            <li><Link to='/console'>Terminal</Link></li>
                        </ul>
                    </>}
                >
                </Route>
                <Route path='/plan/:id' element={<></>} />
                <Route path='/options' element={<Options data={data && {output: data.output, options: data.options}} onChange={handleOptionsChanged} />} />
                <Route path='/console' element={<h1>Console is in the development progress...</h1>} />
            </Routes>
        </ApiContext.Provider>

    );
}

export default App;
