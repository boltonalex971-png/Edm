import React from 'react';
import PropTypes from 'prop-types';
import { GridColumn } from '@progress/kendo-react-grid';
import { RelationTable } from '../../RelationTable';

ProcessQualifiersTab.propTypes = {
    id: PropTypes.number,
    api: PropTypes.string
}

export function ProcessQualifiersTab({ id, api }) {
    return (
        <RelationTable api={`${api}/${id}/qualifiers`} removable editable>
            <GridColumn field='name' title='Name' width={200} />
            <GridColumn field='description' title='Description' width={'auto'} />
        </RelationTable>
    );
}

