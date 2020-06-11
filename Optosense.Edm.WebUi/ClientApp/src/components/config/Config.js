import React from 'react';
import { ConfigMenu } from "./ConfigMenu";
import { Processes } from "./Processes";
import { PageTitle } from "../PageTitle";
import { Switch, Route, useRouteMatch } from 'react-router-dom';
import { Hosts } from './Hosts';
import { Devices } from './Devices';
import { Workplaces } from './Workplaces';

export function Config() {
  let { path } = useRouteMatch();

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <PageTitle title="Configurations" />
        <ConfigMenu />
      </div>
      <hr />
      <div>
        <Switch>
          <Route exact path={path}>
            <p>Select one of the options above</p>
          </Route>
          <Route path={`${path}/processes`}>
            <Processes />
          </Route>
          <Route path={`${path}/workplaces`}>
            <Workplaces />
          </Route>
          <Route path={`${path}/hosts`}>
            <Hosts />
          </Route>
          <Route path={`${path}/devices`}>
            <Devices />
          </Route>
        </Switch>
      </div>
    </>
  );
}
