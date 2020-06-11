import React from 'react';
import PropTypes from 'prop-types';
import { GridColumn } from '@progress/kendo-react-grid';
import { RelationTable } from '../../RelationTable';
import { dropDownCell } from '../../DropDownCell';
import { useGet } from '../../hooks/hooks';

WorkplaceProcessesTab.propTypes = {
    id: PropTypes.number,
    api: PropTypes.string
}

export function WorkplaceProcessesTab({ id, api }) {
    const [[data]] = useGet(`${api}/processes`);
    return (
        <RelationTable api={`${api}/${id}/processes`} removable>
            {data &&
                <GridColumn
                    width={200}
                    field='processId'
                    title='Process'
                    cell={dropDownCell(() => data, 'id', 'name')}
                />
            }
            <GridColumn title='Description' field='processDescription' editable={false} />
        </RelationTable>
    );
}

