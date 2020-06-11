import React from 'react';
import PropTypes from 'prop-types';
import { GridColumn } from '@progress/kendo-react-grid';
import { RelationTable } from '../../RelationTable';
import { dropDownCell } from '../../DropDownCell';
import { useGet } from '../../hooks/hooks';

HostDevicesTab.propTypes = {
    id: PropTypes.number,
    api: PropTypes.string
}

export function HostDevicesTab({ id, api }) {
    const [[data]] = useGet(`${api}/devices`);
    return (
        <RelationTable api={`${api}/${id}/devices`} removable>
            {data &&
                <GridColumn
                    width={200}
                    field='deviceId'
                    title='Device'
                    cell={dropDownCell(() => data, 'id', 'name')}
                />
            }
            <GridColumn field='deviceModel' title='Model' editable={false} />
            <GridColumn field='deviceEnvType' title='Type' editable={false} />
        </RelationTable>
    );
}

