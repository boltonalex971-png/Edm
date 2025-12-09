import React, { useState } from "react";
import {Route, Routes, useNavigate} from 'react-router-dom';
import { Layout } from "./components/Layout";
import { OperationInfo } from "./components/OperationInfo";
import { Config } from "./components/Config";
import {PluginMessageTypes, useOperationData, usePluginMessaging} from "./components/hooks/messagingHooks";

function App(props) {
    const navigate = useNavigate();
    const [settings, setSettings] = useState()
    const info = useOperationData('Init', undefined, 
        (i) => setSettings(JSON.parse(i.process.settings || "[]")))
    useOperationData('Navigate', undefined, (m) => navigate(m))
    const [operationId] = useState(() => new URLSearchParams(document.location.search).get('id') || 0);
    const postMessage = usePluginMessaging(window.parent)
    const saveSettings = (s) => {
        postMessage({type: PluginMessageTypes.settings, data: s})
        setSettings(s)
    }

    if (!info) return (<>Loading...</>)

    return (
        <div className="App">
            <Layout
                content={
                    <Routes>
                        <Route path='/' exact element={
                            <OperationInfo info={info} operationId={operationId} settings={settings} {...props} />
                        } />
                        <Route path='/config' element={
                            <Config
                                apiBase={props.apiBase}
                                operationId={operationId}
                                outputs={info.process.parameters}
                                settings={settings}
                                onSettingsChanged={saveSettings}
                            />
                        } />
                    </Routes>
                }
            />
        </div>
    );
}

export default App;
