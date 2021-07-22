import React from 'react';

export const ApiContext = React.createContext();
export const UserContext = React.createContext();
export const appRoles = Object.freeze({
    admin: 'Admin',
    technologist: 'Technologist',
    operator: 'Operator'
});
