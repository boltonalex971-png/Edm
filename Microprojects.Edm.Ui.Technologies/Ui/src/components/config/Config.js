import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('tech');

  const menuItems = [
    { label: t('config.processes'), path: `${path}/processes`, icon: <AccountTreeIcon fontSize="small" /> },
    { label: t('config.workplaces'), path: `${path}/workplaces`, icon: <BusinessIcon fontSize="small" /> },
    { label: t('config.hosts'), path: `${path}/hosts`, icon: <DnsIcon fontSize="small" /> },
    { label: t('config.devices'), path: `${path}/devices`, icon: <MemoryIcon fontSize="small" /> }
  ];

  return (
    <SubRootPage title={t('config.title')} menuItems={menuItems}>
        <Routes>
          <Route index element={<p>{t('config.selectOption')}</p>} />
          <Route path="processes/*" element={<Processes />} />
          <Route path="workplaces/*" element={<Workplaces />} />
          <Route path="hosts/*" element={<Hosts />} />
          <Route path="devices/*" element={<Devices />} />
        </Routes>
    </SubRootPage>
  );
}
