import React from 'react';
import PropTypes from 'prop-types';
import { GridColumn } from '@progress/kendo-react-grid';
import { RelationTable } from '../../RelationTable';
import { dropDownCell } from '../../DropDownCell';
import { useGet } from '../../hooks/hooks';

WorkplaceDevicesTab.propTypes = {
    id: PropTypes.number,
    api: PropTypes.string
}

export function WorkplaceDevicesTab({ id, api }) {
    const [[data]] = useGet(`${api}/devices`);
    return (
        <RelationTable api={`${api}/${id}/devices`} removable>
            {data &&
                <GridColumn
                    width={200}
                    field='hostDeviceId'
                    title='Device'
                    cell={dropDownCell(() => data, 'id', 'name')}
                />
            }
            <GridColumn field='model' title='Model' editable={false} />
            <GridColumn field='envType' title='Type' editable={false} />
            <GridColumn field='host' title='Control Host' editable={false} />
        </RelationTable>
    );
}

