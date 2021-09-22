import React from 'react';
import { PluginsMenu } from "./PluginsMenu";
import { PageTitle } from "../PageTitle";
import { Switch, Route, useRouteMatch } from 'react-router-dom';
import { ProfilePlugins } from './ProfilePlugins';
import { OperationPlugins } from './OperationPlugins';
import { DriverPlugins } from './DriverPlugins';

export function Plugins() {
    let { path } = useRouteMatch();

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <PageTitle title="Configurations" />
                <PluginsMenu />
            </div>
            <hr />
            <div>
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
            </div>
        </>
    );
}
