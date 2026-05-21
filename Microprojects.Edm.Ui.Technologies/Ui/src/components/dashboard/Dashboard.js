import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SubRootPage } from '@microprojects/edm-components/components';
import { useBasePath } from '@microprojects/edm-components/hooks';
import {
    PlayCircleOutline as PlayCircleOutlineIcon,
    PeopleOutline as PeopleOutlineIcon,
    EventNote as EventNoteIcon
} from '@mui/icons-material';
import Schedule from './Schedule';
import Users from './Users';
import Operations from './Operations';

export function Dashboard() {
    const path = useBasePath();
    const { t } = useTranslation('tech');

    const menuItems = [
        { label: t('dashboard.operations'), path: `${path}/operations`, icon: <PlayCircleOutlineIcon fontSize="small" /> },
        { label: t('dashboard.users'), path: `${path}/users`, icon: <PeopleOutlineIcon fontSize="small" /> },
        { label: t('dashboard.schedule'), path: `${path}/schedule`, icon: <EventNoteIcon fontSize="small" /> }
    ];

    return (
        <SubRootPage title={t('dashboard.title')} menuItems={menuItems}>
            <Routes>
                <Route index element={<Navigate to="operations" replace />} />
                <Route path="operations/:when?" element={<Operations />} />
                <Route path="users" element={<Users />} />
                <Route path="schedule" element={<Schedule />} />
            </Routes>
        </SubRootPage>
    );
}
