import React from 'react';
import { Switch, Route, useRouteMatch, Redirect } from 'react-router-dom';
import { SubRootPage } from '../SubRootPage';
import {
    PlayCircleOutline as PlayCircleOutlineIcon,
    PeopleOutline as PeopleOutlineIcon,
    EventNote as EventNoteIcon
} from '@mui/icons-material';
import Schedule from './Schedule';
import Users from './Users';
import Operations from './Operations';

export function Dashboard() {
    let { path } = useRouteMatch();

    const menuItems = [
        { label: 'Operations', path: `${path}/operations`, icon: <PlayCircleOutlineIcon fontSize="small" /> },
        { label: 'Users', path: `${path}/users`, icon: <PeopleOutlineIcon fontSize="small" /> },
        { label: 'Schedule', path: `${path}/schedule`, icon: <EventNoteIcon fontSize="small" /> }
    ];

    return (
        <SubRootPage title="Dashboard" menuItems={menuItems}>
            <Switch>
                <Route exact path={path}>
                    <Redirect to={`${path}/operations`} />
                </Route>
                <Route path={`${path}/operations/:when?`}>
                    <Operations />
                </Route>
                <Route path={`${path}/users`}>
                    <Users />
                </Route>
                <Route path={`${path}/schedule`}>
                    <Schedule />
                </Route>
            </Switch>
        </SubRootPage>
    );
}
