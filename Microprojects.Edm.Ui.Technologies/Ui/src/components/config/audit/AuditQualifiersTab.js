import React from 'react';
import PropTypes from 'prop-types';
import { RelationTable } from '@microprojects/edm-components/components';
import { useGet } from '@microprojects/edm-components/hooks';
import { DropDownCell } from '@microprojects/edm-components/components';
import { useTranslation } from 'react-i18next';

AuditQualifiersTab.propTypes = {
    id: PropTypes.string,
    api: PropTypes.string
}

export function AuditQualifiersTab({ id, api }) {
    const [[data]] = useGet(`${api}/${id}/process/qualifiers`);
    const { t } = useTranslation('tech');

    const columns = [
        {
            field: 'id',
            headerName: t('common.name'),
            width: 200,
            renderCell: (params) => (
                <DropDownCell
                    {...params}
                    getData={() => data || []}
                    dataKey='id'
                    text='name'
                    fieldId='id'
                />
            )
        },
        { field: 'description', headerName: t('common.description'), flex: 1, editable: false }
    ];

    return (
        <RelationTable
            api={`${api}/${id}/qualifiers`}
            removable
            columns={columns}
        />
    );
}


