import React from 'react';
import PropTypes from 'prop-types';
import { RelationTable } from '@microprojects/edm-components/components';
import { useTranslation } from 'react-i18next';

ProcessQualifiersTab.propTypes = {
    id: PropTypes.string,
    api: PropTypes.string
}

export function ProcessQualifiersTab({ id, api }) {
    const { t } = useTranslation('tech');
    const columns = [
        { field: 'name', headerName: t('common.name'), width: 200, editable: true },
        { field: 'description', headerName: t('common.description'), flex: 1, editable: true }
    ];

    return (
        <RelationTable 
            api={`${api}/${id}/qualifiers`} 
            removable 
            editable
            columns={columns}
        />
    );
}


