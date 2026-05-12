import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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

    const menuItems = [
        { label: 'Operations', path: `${path}/operations`, icon: <PlayCircleOutlineIcon fontSize="small" /> },
        { label: 'Users', path: `${path}/users`, icon: <PeopleOutlineIcon fontSize="small" /> },
        { label: 'Schedule', path: `${path}/schedule`, icon: <EventNoteIcon fontSize="small" /> }
    ];

    return (
        <SubRootPage title="Dashboard" menuItems={menuItems}>
            <Routes>
                <Route index element={<Navigate to="operations" replace />} />
                <Route path="operations/:when?" element={<Operations />} />
                <Route path="users" element={<Users />} />
                <Route path="schedule" element={<Schedule />} />
            </Routes>
        </SubRootPage>
    );
}
