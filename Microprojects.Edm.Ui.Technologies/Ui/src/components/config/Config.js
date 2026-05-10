import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SubRootPage } from '@microprojects/edm-components/components';
import { useBasePath } from '@microprojects/edm-components/hooks';
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
  const path = useBasePath();

  const menuItems = [
    { label: 'Processes', path: `${path}/processes`, icon: <AccountTreeIcon fontSize="small" /> },
    { label: 'Workplaces', path: `${path}/workplaces`, icon: <BusinessIcon fontSize="small" /> },
    { label: 'Hosts', path: `${path}/hosts`, icon: <DnsIcon fontSize="small" /> },
    { label: 'Devices', path: `${path}/devices`, icon: <MemoryIcon fontSize="small" /> }
  ];

  return (
    <SubRootPage title="Configuration" menuItems={menuItems}>
        <Routes>
          <Route index element={<p>Select one of the options above</p>} />
          <Route path="processes/*" element={<Processes />} />
          <Route path="workplaces/*" element={<Workplaces />} />
          <Route path="hosts/*" element={<Hosts />} />
          <Route path="devices/*" element={<Devices />} />
        </Routes>
    </SubRootPage>
  );
}
