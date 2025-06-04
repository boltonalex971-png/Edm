import React, { useState, useCallback, useEffect } from "react";
import { Outlet, Route, Routes, useLocation, useSearchParams } from 'react-router-dom';
// import logo from "./logo.svg";
//import "./App.css";
// import { FetchData } from "./FetchData";
import { Layout } from "./components/Layout";
import { OperationInfo } from "./components/OperationInfo";
import queryString from 'query-string';
import { OperationMenu } from "./components/OperationMenu";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Config } from "./components/Config";
import { useGet } from "./components/hooks/hooks";
import { defaultOptions } from "./components/DefaultOptions";
import { useOperationData, types } from '@microprojects/react-utils'

function App({ apiBase }) {
    // const location = useLocation();
    // const query = queryString.parse(location.search);
    const [searchParams] = useSearchParams();
    const [operationId] = useState(searchParams.get('id'));
    const [[processInfo]] = useGet(`${apiBase}/api/operations/${operationId}/processInfo`);
    const [settings, setSettings] = useState();
    const [started, setStarted] = useState(false);
    const [lifecycle] = useOperationData(types.operationLifecycle, (d) => setStarted(d.Start))
    useEffect(() => {
        if (!processInfo) {
            return;
        }
        
        setSettings(processInfo.settings ? JSON.parse(processInfo.settings) : defaultOptions)
    }, [processInfo])
    return (
        <Routes>
            <Route path="*" element={
                <Outlet context={{ operationId, apiBase, processInfo }} />
            }>
                <Route index element={
                    settings && <OperationInfo settings={settings} started={started} /> || 'Loading...'
                } />
                <Route path='config' element={
                    settings && <Config settings={settings} setSettings={setSettings} outputs={processInfo.parameters} /> || 'Loading...'
                } />
            </Route>
        </Routes>
    );
}

export default App;
