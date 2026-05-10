import React from 'react';
import PropTypes from 'prop-types';
import { RelationTable } from '@microprojects/edm-components/components';
import { LinkTextCell } from '@microprojects/edm-components/components';
import { WorkbenchDetail } from '../Workbenches';

ProcessWorkbenchesTab.propTypes = {
    id: PropTypes.number,
    api: PropTypes.string,
    onDetailSelected: PropTypes.func
}

export function ProcessWorkbenchesTab({ id, api, onDetailSelected, parents }) {
    const columns = [
        {
            field: 'name',
            headerName: 'Name',
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
        { field: 'description', headerName: 'Description', flex: 1, editable: true }
    ];

    return (
        <RelationTable 
            api={`${api}/${id}/workbenches`} 
            removable 
            columns={columns}
        />
    );
}


