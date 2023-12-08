import React from 'react';
import PropTypes from 'prop-types';
import { GridColumn } from '@progress/kendo-react-grid';
import { RelationTable } from '../../RelationTable';
import { useGet } from '../../hooks/hooks';
import { DropDownCell } from '../../DropDownCell';

AuditQualifiersTab.propTypes = {
    id: PropTypes.number,
    api: PropTypes.string
}

export function AuditQualifiersTab({ id, api }) {
    const [[data]] = useGet(`${api}/${id}/process/qualifiers`);
    return (
        <RelationTable api={`${api}/${id}/qualifiers`} removable >
            <GridColumn
                width={200}
                field='id'
                title='Name'
                cell={(cellProps) => data &&
                    <DropDownCell {...cellProps}
                        getData={() => data} id='id' text='name' fieldId='id'
                    />
                }
            />
            <GridColumn field='description' title='Description' width={'auto'} editable={false} />
        </RelationTable>
    );
}

