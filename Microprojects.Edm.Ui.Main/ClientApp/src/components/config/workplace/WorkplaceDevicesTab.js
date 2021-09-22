import React from 'react';
import PropTypes from 'prop-types';
import { GridColumn } from '@progress/kendo-react-grid';
import { RelationTable } from '../../RelationTable';
import { DropDownCell } from '../../DropDownCell';
import { useGet } from '../../hooks/hooks';
import { DeviceDetail } from '../Devices';
import Api from '../../api';
import { useHistory } from 'react-router-dom';
import { HostDetail } from '../Hosts';

WorkplaceDevicesTab.propTypes = {
    id: PropTypes.number,
    api: PropTypes.string,
    onDetailSelected: PropTypes.func
}

export function WorkplaceDevicesTab({ id, api, onDetailSelected }) {
    const history = useHistory();
    const [[deviceList]] = useGet(`${api}/devices`, []);
    const deviceClick = (deviceId) => {
        const path = '/config/devices';
        onDetailSelected(
            <DeviceDetail
                deviceId={deviceId}
                api={Api.devices}
                path={path}
                onClose={() => onDetailSelected()}
                onUp={() => history.push(`${path}/${deviceId}`)}
            />
        );
    };
    const hostClick = (hostId) => {
        const path = '/config/hosts';
        onDetailSelected(
            <HostDetail
                hostId={hostId}
                api={Api.hosts}
                path={path}
                onClose={() => onDetailSelected()}
                onUp={() => history.push(`${path}/${hostId}`)}
            />
        );
    };
    return (
        <RelationTable api={`${api}/${id}/devices`} removable>
            {deviceList &&
                <GridColumn
                    field='hostDeviceId'
                    title='Device'
                    cell={(cellProps) =>
                        <DropDownCell {...cellProps}
                            getData={() => deviceList}
                            id='id'
                            text='name'
                            fieldId='deviceId'
                            fieldName='device'
                        />
                    }
                />
            }
            <GridColumn field='hostId' title='Host' editable={false}
                cell={(cellProps) =>
                    <DropDownCell {...cellProps}
                        fieldName='host'
                        onClick={hostClick}
                    />
                }
            />
            <GridColumn field='driverName' title='Driver' editable={false} />
            <GridColumn field='profilerName' title='Profiler' editable={false} />
        </RelationTable>
    );
}

