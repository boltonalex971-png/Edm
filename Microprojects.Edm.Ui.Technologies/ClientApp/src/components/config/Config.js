import React from 'react';
import { Switch, Route, useRouteMatch } from 'react-router-dom';
import { SubRootPage } from '../SubRootPage';
import {
  AccountTree as AccountTreeIcon,
  Business as BusinessIcon,
  Dns as DnsIcon,
  Memory as MemoryIcon
} from '@mui/icons-material';
import { Processes } from "./Processes";
import { Hosts } from './Hosts';
import { Devices } from './Devices';
import { Workplaces } from './Workplaces';

export function Config() {
  let { path } = useRouteMatch();

  const menuItems = [
    { label: 'Processes', path: `${path}/processes`, icon: <AccountTreeIcon fontSize="small" /> },
    { label: 'Workplaces', path: `${path}/workplaces`, icon: <BusinessIcon fontSize="small" /> },
    { label: 'Hosts', path: `${path}/hosts`, icon: <DnsIcon fontSize="small" /> },
    { label: 'Devices', path: `${path}/devices`, icon: <MemoryIcon fontSize="small" /> }
  ];

  return (
    <SubRootPage title="Configuration" menuItems={menuItems}>
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
    </SubRootPage>
  );
}
