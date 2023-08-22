import React from 'react';
import Api from '../../api';
import PropTypes from 'prop-types';
import { GridColumn } from '@progress/kendo-react-grid';
import { RelationTable, SubDetailColumn } from '../../RelationTable';
import { DropDownCell } from '../../DropDownCell';
import { useGet } from '../../hooks/hooks';
import { DeviceDetail } from '../Devices';
import { useHistory } from 'react-router-dom';

HostDevicesTab.propTypes = {
    id: PropTypes.number,
    api: PropTypes.string,
    onDetailSelected: PropTypes.func
}

export function HostDevicesTab({ id, api, onDetailSelected }) {
    const history = useHistory();
    const [[data]] = useGet(`${api}/devices`);
    const path = '/config/devices';
    return (
        <RelationTable api={`${api}/${id}/devices`} removable >
            <SubDetailColumn
                width={200}
                field='deviceId'
                title='Device'
                cell={(cellProps) => data &&
                    <DropDownCell {...cellProps}
                        getData={() => data} id='id' text='name' fieldName='deviceName'
                        onClick={(deviceId) => onDetailSelected(
                            <DeviceDetail
                                deviceId={deviceId}
                                api={Api.devices}
                                path={path}
                                onClose={() => onDetailSelected()}
                                onUp={() => history.push(`${path}/${deviceId}`)}
                                onUpdate={cellProps.itemUpdate}
                            />)
                        }
                    />
                }
            />
            <GridColumn field='driverName' title='Driver' editable={false} />
            <GridColumn field='profilerName' title='Profiler' editable={false} />
        </RelationTable>
    );
}

