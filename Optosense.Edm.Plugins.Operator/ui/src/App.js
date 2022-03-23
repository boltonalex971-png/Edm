import React, { useState, useCallback } from "react";
import { Route, useLocation } from 'react-router-dom';
// import logo from "./logo.svg";
//import "./App.css";
// import { FetchData } from "./FetchData";
import { Layout } from "./components/Layout";
import { OperationInfo } from "./components/OperationInfo";
import queryString from 'query-string';
import { OperationMenu } from "./components/OperationMenu";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Config } from "./components/Config";
import { Routes } from "react-router-dom";
import { Outlet } from "react-router-dom";

function App(props) {
    const location = useLocation();
    const query = queryString.parse(location.search);
    const [operationId] = useState(query.id || 0);
    const [started, setStarted] = useState(false);
    const onStarted = useCallback(() => setStarted(true), [])
    const onFinished = useCallback(() => setStarted(false), [])
    return (
        <div className="App">
            <Layout
                header={
                    <OperationMenu  {...props}
                        operationId={operationId}
                        onStarted={onStarted}
                        onCompleted={onFinished}
                        onCancelled={onFinished}
                    />
                }
                content={
                    <OperationInfo operationId={operationId} started={started} {...props} />
                    // <>
                    //     <Routes>
                    //         <Route path='/' component={
                    //             <OperationInfo operationId={operationId} started={started} {...props} />
                    //         } />
                    //         <Route path='/config' component={
                    //             <Config apiBase={props.apiBase} />
                    //         } />
                    //     </Routes>
                    //     <Outlet />
                    // </>
                }
            />
        </div>
    );
}

export default App;
