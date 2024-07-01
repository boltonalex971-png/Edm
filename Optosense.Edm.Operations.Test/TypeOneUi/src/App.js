import React, { useState, useEffect } from "react";
import { Route, Routes } from 'react-router-dom';
import { Layout } from "./components/Layout";
import { OperationInfo } from "./components/OperationInfo";
import { Config } from "./components/Config";
import { usePluginData, types, useOperationData } from '@microprojects/react-utils'
import { useGet } from "./components/hooks/hooks";

function App(props) {
    const [data] = usePluginData()
    const [settings, setSettings] = useState()
    const [operationId] = useState(() => new URLSearchParams(document.location.search).get('id') || 0);
    const [[processInfo]] = useGet(`${props.apiBase}/api/operations/${operationId}/processInfo`, [], (p) => {
        setSettings(JSON.parse(p.settings || "[]"))
    });
    const [started, setStarted] = useState(false);
    const [lifecycle] = useOperationData(types.operationLifecycle)
    useEffect(() => {
        setStarted(lifecycle?.Start)
    }, [lifecycle])
    if (!settings) return (<>Loading...</>)
    return (
        <div className="App">
            <Layout
                content={
                    <Routes>
                        <Route path='/' exact element={
                            <OperationInfo operationId={operationId} started={started} {...props} settings={settings} />
                        } />
                        <Route path='/config' element={
                            <Config
                                apiBase={props.apiBase}
                                operationId={operationId}
                                outputs={processInfo?.parameters}
                                settings={settings}
                                onSettingsChanged={() => { }}
                            />
                        } />
                    </Routes>
                }
            />
        </div>
    );
}

export default App;
