import React from 'react';
import { useTranslation } from 'react-i18next';

const Schedule = (props) => {
    const { t } = useTranslation('tech');
    return (
        <p>{t('dashboard.scheduleStub')}</p>
    );
};

export default Schedule;
