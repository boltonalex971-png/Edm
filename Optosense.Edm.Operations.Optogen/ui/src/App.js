import React, { useState } from "react";
import {Outlet, Route, Routes, useNavigate, useSearchParams} from 'react-router-dom';
import { OperationInfo } from "./components/OperationInfo";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Config } from "./components/Config";
import { defaultOptions } from "./components/DefaultOptions";
import {useOperationData, PluginMessageTypes, usePluginMessaging} from '@microprojects/tools'

// Operator driver guid shouldn't be changed ever
const OPERATOR_DRIVER_GUID = 'f222f3fa-0c13-4ae1-9b2d-cb055d4b9679'

function App() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams();
    const [settings, setSettings] = useState();
    const [profile, setProfile] = useState();
    const [operationId] = useState(searchParams.get('id'));
    const info = useOperationData(PluginMessageTypes.INIT, undefined, (i) => {
        setSettings(i.process.settings ? JSON.parse(i.process.settings) : defaultOptions)
        const operatorDevice = i.devices.find((d) => d.hostDevice.device.driverGuid === OPERATOR_DRIVER_GUID) 
        setProfile(JSON.parse(operatorDevice.profile.textJson || '[]').sort((a, b) => a.order - b.order));
    })
    useOperationData(PluginMessageTypes.NAVIGATE, '', (m) => navigate(m))
    const postMessage = usePluginMessaging(window.parent)
    const saveSettings = (s) => {
        postMessage({type: PluginMessageTypes.SETTINGS, data: s})
        setSettings(s)
    }

    return (
        <Routes>
            <Route path="*" element={
                <Outlet />
            }>
                    <Route index element={
                        settings && <OperationInfo settings={settings} records={info.records} profile={profile}/> || 'Loading...'
                    } />
                    <Route path='config' element={
                        settings && <Config settings={settings} onSettingsChanged={saveSettings} outputs={info.process.parameters} /> || 'Loading...'
                    } />
            </Route>
        </Routes>
    );
}

export default App;
