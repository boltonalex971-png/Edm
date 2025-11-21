import React from 'react';
import { PageTitle } from "../PageTitle";
import { Switch, Route, useRouteMatch } from 'react-router-dom';
import { DashboardMenu } from './DashboardMenu';
import Schedule from './Schedule';
import Users from './Users';
import Operations from './Operations';
import Workplaces from './Workplaces';

export function Dashboard() {
    let { path } = useRouteMatch();

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <PageTitle title="Dashboard" />
                <DashboardMenu />
            </div>
            <hr />
            <div>
                <Switch>
                    <Route exact path={path}>
                        <p>Select one of the options above</p>
                    </Route>
                    <Route path={`${path}/operations/:when?`}>
                        <Operations />
                    </Route>
                    <Route path={`${path}/workplaces`}>
                        <Workplaces />
                    </Route>
                    <Route path={`${path}/users`}>
                        <Users />
                    </Route>
                    <Route path={`${path}/schedule`}>
                        <Schedule />
                    </Route>
                </Switch>
            </div>
        </>
    );
}
