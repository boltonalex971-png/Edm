import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SubRootPage } from '@microprojects/edm-components/components';
import { useBasePath } from '@microprojects/edm-components/hooks';
import {
    SettingsInputComponent as SettingsInputComponentIcon,
    Description as DescriptionIcon,
    Extension as ExtensionIcon
} from '@mui/icons-material';
import { ProfilePlugins } from './ProfilePlugins';
import { OperationPlugins } from './OperationPlugins';
import { DriverPlugins } from './DriverPlugins';

export function Plugins() {
    const path = useBasePath();

    const menuItems = [
        { label: 'Drivers', path: `${path}/drivers`, icon: <SettingsInputComponentIcon fontSize="small" /> },
        { label: 'Profiles', path: `${path}/profiles`, icon: <DescriptionIcon fontSize="small" /> },
        { label: 'Operations', path: `${path}/operations`, icon: <ExtensionIcon fontSize="small" /> }
    ];

    return (
        <SubRootPage title="Plugins" menuItems={menuItems}>
            <Routes>
                <Route index element={<p>Select one of the options above</p>} />
                <Route path="drivers" element={<DriverPlugins />} />
                <Route path="profiles" element={<ProfilePlugins />} />
                <Route path="operations" element={<OperationPlugins />} />
            </Routes>
        </SubRootPage>
    );
}
