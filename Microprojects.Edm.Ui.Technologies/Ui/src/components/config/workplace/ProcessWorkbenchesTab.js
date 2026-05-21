import React from 'react';
import PropTypes from 'prop-types';
import { RelationTable } from '@microprojects/edm-components/components';
import { LinkTextCell } from '@microprojects/edm-components/components';
import { useTranslation } from 'react-i18next';
import { WorkbenchDetail } from '../Workbenches';

ProcessWorkbenchesTab.propTypes = {
    id: PropTypes.number,
    api: PropTypes.string,
    onDetailSelected: PropTypes.func
}

export function ProcessWorkbenchesTab({ id, api, onDetailSelected, parents }) {
    const { t } = useTranslation('tech');
    const columns = [
        {
            field: 'name',
            headerName: t('common.name'),
            width: 200,
            editable: true,
            renderCell: (params) => (
                <LinkTextCell
                    {...params}
                    fieldId='id'
                    onClick={(wbId, itemUpdate) => {
                        onDetailSelected(
                            <WorkbenchDetail
                                workbenchId={wbId}
                                api={`${api}/workbenches`}
                                onClose={() => onDetailSelected()}
                                onUpdate={itemUpdate}
                                parents={parents}
                            />
                        );
                    }}
                />
            )
        },
        { field: 'description', headerName: t('common.description'), flex: 1, editable: true }
    ];

    return (
        <RelationTable 
            api={`${api}/${id}/workbenches`} 
            removable 
            columns={columns}
        />
    );
}


