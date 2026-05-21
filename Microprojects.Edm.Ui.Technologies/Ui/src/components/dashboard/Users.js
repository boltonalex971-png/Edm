import React from 'react';
import { useTranslation } from 'react-i18next';

const Users = (props) => {
    const { t } = useTranslation('tech');
    return (
        <p>{t('dashboard.usersStub')}</p>
    );
};

export default Users;
