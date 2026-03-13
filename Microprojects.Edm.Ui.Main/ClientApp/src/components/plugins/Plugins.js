import React from 'react';
import { Switch, Route, useRouteMatch } from 'react-router-dom';
import { SubRootPage } from '../SubRootPage';
import {
    SettingsInputComponent as SettingsInputComponentIcon,
    Description as DescriptionIcon,
    Extension as ExtensionIcon
} from '@mui/icons-material';
import { ProfilePlugins } from './ProfilePlugins';
import { OperationPlugins } from './OperationPlugins';
import { DriverPlugins } from './DriverPlugins';

export function Plugins() {
    let { path } = useRouteMatch();

    const menuItems = [
        { label: 'Drivers', path: `${path}/drivers`, icon: <SettingsInputComponentIcon fontSize="small" /> },
        { label: 'Profiles', path: `${path}/profiles`, icon: <DescriptionIcon fontSize="small" /> },
        { label: 'Operations', path: `${path}/operations`, icon: <ExtensionIcon fontSize="small" /> }
    ];

    return (
        <SubRootPage title="Plugins" menuItems={menuItems}>
            <Switch>
                <Route exact path={path}>
                    <p>Select one of the options above</p>
                </Route>
                <Route path={`${path}/drivers`}>
                    <DriverPlugins />
                </Route>
                <Route path={`${path}/profiles`}>
                    <ProfilePlugins />
                </Route>
                <Route path={`${path}/operations`}>
                    <OperationPlugins />
                </Route>
            </Switch>
        </SubRootPage>
    );
}
