import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation('tech');

    const menuItems = [
        { label: t('plugins.drivers'), path: `${path}/drivers`, icon: <SettingsInputComponentIcon fontSize="small" /> },
        { label: t('plugins.profiles'), path: `${path}/profiles`, icon: <DescriptionIcon fontSize="small" /> },
        { label: t('plugins.operations'), path: `${path}/operations`, icon: <ExtensionIcon fontSize="small" /> }
    ];

    return (
        <SubRootPage title={t('plugins.title')} menuItems={menuItems}>
            <Routes>
                <Route index element={<p>{t('plugins.selectOption')}</p>} />
                <Route path="drivers" element={<DriverPlugins />} />
                <Route path="profiles" element={<ProfilePlugins />} />
                <Route path="operations" element={<OperationPlugins />} />
            </Routes>
        </SubRootPage>
    );
}
