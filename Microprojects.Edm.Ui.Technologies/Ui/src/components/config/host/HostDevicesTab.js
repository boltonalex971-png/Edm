import React from 'react';
import Api from '../../api';
import PropTypes from 'prop-types';
import { RelationTable } from '@microprojects/edm-components/components';
import { DropDownCell } from '@microprojects/edm-components/components';
import { useGet } from '@microprojects/edm-components/hooks';
import { DeviceDetail } from '../Devices';
import { useNavigate } from 'react-router-dom';

HostDevicesTab.propTypes = {
    id: PropTypes.number,
    api: PropTypes.string,
    onDetailSelected: PropTypes.func
}

export function HostDevicesTab({ id, api, onDetailSelected, parents }) {
    const navigate = useNavigate();
    const [[data]] = useGet(`${api}/devices`);
    const path = '/config/devices';

    const columns = [
        {
            field: 'deviceId',
            headerName: 'Device',
            width: 200,
            renderCell: (params) => (
                <DropDownCell 
                    {...params}
                    getData={() => data || []} 
                    dataKey='id' 
                    text='name' 
                    fieldName='deviceName'
                    onClick={(deviceId, itemUpdate) => onDetailSelected(
                        <DeviceDetail
                            type='device'
                            deviceId={deviceId}
                            api={Api.devices}
                            path={path}
                            onClose={() => onDetailSelected()}
                            onUp={() => navigate(`${path}/${deviceId}`)}
                            onUpdate={itemUpdate}
                            parents={parents}
                        />)
                    }
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


