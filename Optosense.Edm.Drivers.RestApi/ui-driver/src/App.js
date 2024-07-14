import React, { useState } from 'react';
import { Route, Router, Link, Routes } from 'react-router-dom';
import { Options } from './Options';
import '@progress/kendo-theme-bootstrap/dist/all.scss';
import { usePluginData } from '@microprojects/react-utils';


function App() {
    const [data, setData] = process.env.NODE_ENV === 'production' ? usePluginData() :
        useState({
            options: {
                contentType: "application/json",
                baseUrl: 'http://localhost:5000',
                token: '---',
                initialSerialNo: 90000000
            }
        })
    return (data &&
        <div>
            <Routes>
                <Route path='/' exact element={
                    <>
                        <h1>Home</h1>
                        <ul>
                            <li><Link to='/plan'>Execution plan</Link></li>
                            <li><Link to='/options'>Options</Link></li>
                            <li><Link to='/console'>Console</Link></li>
                        </ul>
                    </>
                } />
                <Route path='/plan' element={<p>No execution plan available</p>} />
                <Route path='/options' element={
                    <Options options={data?.options || {}} changeOptions={setData} />
                } />
                <Route path='/console' element={
                    <p>Console is in the development progress...</p>
                } />
            </Routes>
        </div>
    );
}



export default App;
