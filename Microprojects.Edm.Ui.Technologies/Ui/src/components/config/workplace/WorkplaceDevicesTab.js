import React from 'react';
import PropTypes from 'prop-types';
import { RelationTable } from '@microprojects/edm-components/components';
import { DropDownCell } from '@microprojects/edm-components/components';
import { useGet } from '@microprojects/edm-components/hooks';
import { DeviceDetail } from '../Devices';
import Api from '../../api';
import { useHistory } from 'react-router-dom';
import { HostDetail } from '../Hosts';

WorkplaceDevicesTab.propTypes = {
    id: PropTypes.number,
    api: PropTypes.string,
    onDetailSelected: PropTypes.func
}

export function WorkplaceDevicesTab({ id, api, onDetailSelected, parents }) {
    const history = useHistory();
    const [[deviceList]] = useGet(`${api}/devices`, [api]);
    const [[hostList]] = useGet(Api.hosts, []);

    const columns = [
        {
            field: 'hostDeviceId',
            headerName: 'Device',
            width: 250,
            renderCell: (params) => (
                <DropDownCell 
                    {...params}
                    getData={() => deviceList || []}
                    dataKey='id'
                    text='name'
                    fieldId='deviceId'
                    fieldName='device'
                    onClick={(deviceId, itemUpdate) => {
                        const path = '/config/devices';
                        onDetailSelected(
                            <DeviceDetail
                                deviceId={deviceId}
                                api={Api.devices}
                                path={path}
                                onClose={() => onDetailSelected()}
                                onUp={() => history.push(`${path}/${deviceId}`)}
                                onUpdate={itemUpdate}
                                parents={parents}
                            />
                        );
                    }}
                />
            )
        },
        {
            field: 'hostId',
            headerName: 'Host',
            width: 200,
            editable: false,
            renderCell: (params) => (
                <DropDownCell 
                    {...params}
                    getData={() => hostList || []}
                    dataKey='id'
                    text='name'
                    fieldId='hostId'
                    fieldName='host'
                    onClick={(hostId, itemUpdate) => {
                        const path = '/config/hosts';
                        onDetailSelected(
                            <HostDetail
                                hostId={hostId}
                                api={Api.hosts}
                                path={path}
                                onClose={() => onDetailSelected()}
                                onUp={() => history.push(`${path}/${hostId}`)}
                                onUpdate={itemUpdate}
                                parents={parents}
                            />
                        );
                    }}
                />
            )
        },
        { field: 'driverName', headerName: 'Driver', flex: 1, editable: false },
        { field: 'profilerName', headerName: 'Profiler', flex: 1, editable: false }
    ];

    return (
        <RelationTable 
            api={`${api}/${id}/devices`} 
            removable
            columns={columns}
        />
    );
}


