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

function App({ apiBase }) {
    // const location = useLocation();
    // const query = queryString.parse(location.search);
    const [searchParams] = useSearchParams();
    const [operationId] = useState(searchParams.get('id'));
    const [[processInfo]] = useGet(`${apiBase}/api/operations/${operationId}/processInfo`);
    const [settings, setSettings] = useState();

    useEffect(() => {
        if (processInfo && !settings) {
            setSettings(JSON.parse(processInfo.settings || '{}'));
        }
    }, [processInfo, settings]);

    const [started, setStarted] = useState(false);
    const onStarted = useCallback(() => setStarted(true), [])
    const onFinished = useCallback(() => setStarted(false), [])
    return (
        <Routes>
            <Route path="*" element={
                <Layout
                    header={
                        <OperationMenu
                            apiBase={apiBase}
                            operationId={operationId}
                            process={processInfo}
                            onStarted={onStarted}
                            onCompleted={onFinished}
                            onCancelled={onFinished}
                        />
                    }
                >
                    <Outlet context={{ operationId, apiBase, processInfo }} />
                </Layout>
            }>
                <Route index element={
                    settings && <OperationInfo settings={settings} started={started} /> || 'Loading...'
                } />
                <Route path='config' element={
                    settings && <Config settings={settings} setSettings={setSettings} /> || 'Loading...'
                } />
            </Route>
        </Routes>
    );
}

export default App;
