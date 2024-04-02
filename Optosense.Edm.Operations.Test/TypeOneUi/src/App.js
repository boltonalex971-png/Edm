import React, { useState, useCallback, useEffect } from "react";
import { Route, useLocation } from 'react-router-dom';
// import logo from "./logo.svg";
//import "./App.css";
// import { FetchData } from "./FetchData";
import { Layout } from "./components/Layout";
import { OperationInfo } from "./components/OperationInfo";
import queryString from 'query-string';
import { Config } from "./components/Config";
import { usePluginData, types, useOperationData } from '@microprojects/react-utils'

function App(props) {
    const [data] = usePluginData()
    const location = useLocation();
    const query = queryString.parse(location.search);
    const [operationId] = useState(query.id || 0);
    const [started, setStarted] = useState(false);
    const [lifecycle] = useOperationData(types.operationLifecycle)
    useEffect(() => {
        setStarted(lifecycle?.Start)
    }, [lifecycle])
    return (
        <div className="App">
            <Layout
                content={
                    <>
                        <Route path='/' exact>
                            <OperationInfo operationId={operationId} started={started} {...props} />
                        </Route>
                        <Route path='/config'>
                            <Config apiBase={props.apiBase} />
                        </Route>
                    </>
                }
            />
        </div>
    );
}

export default App;
