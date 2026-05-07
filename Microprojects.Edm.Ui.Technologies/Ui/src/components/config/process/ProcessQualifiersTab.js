import React from 'react';
import PropTypes from 'prop-types';
import { RelationTable } from '../../RelationTable';

ProcessQualifiersTab.propTypes = {
    id: PropTypes.number,
    api: PropTypes.string
}

export function ProcessQualifiersTab({ id, api }) {
    const columns = [
        { field: 'name', headerName: 'Name', width: 200, editable: true },
        { field: 'description', headerName: 'Description', flex: 1, editable: true }
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


