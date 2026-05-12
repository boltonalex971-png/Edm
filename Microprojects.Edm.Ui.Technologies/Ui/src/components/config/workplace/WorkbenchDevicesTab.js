import React from 'react';
import Api from '../../api';
import PropTypes from 'prop-types';
import { RelationTable } from '@microprojects/edm-components/components';
import { DropDownCell, LinkTextCell } from '@microprojects/edm-components/components';
import { useGet } from '@microprojects/edm-components/hooks';
import { useNavigate } from 'react-router-dom';
import { DeviceDetail } from '../Devices';
import { DeviceConfigEditor } from './DeviceConfigEditor';
import { ProfileDetail } from '../Profiles';

WorkbenchDevicesTab.propTypes = {
    id: PropTypes.number,
    processId: PropTypes.number,
    api: PropTypes.string,
    onDetailSelected: PropTypes.func
}

export function WorkbenchDevicesTab({ id, api, processId, onDetailSelected }) {
    const navigate = useNavigate();
    const [[devices]] = useGet(`${Api.workplaces}/processes/workbenches/${id}/requireddevices`, [id]);
    const [[profiles]] = useGet(`${Api.processes}/${processId}/profiles`, [processId]);
    const devicesPath = '/config/devices';
    let profilers = profiles;

    const configClick = (id) => {
        onDetailSelected(
            <DeviceConfigEditor
                id={id}
                api={`${api}/devices`}
                onClose={() => onDetailSelected()}
            />
        );
    };

    const handleDeviceChange = (e, onChange) => {
        onChange(e);
        const device = devices.find(d => d.id === e.value);
        profilers = profiles.filter(p => device.profilerGuid === '00000000-0000-0000-0000-000000000000' || p.profilerGuid === device.profilerGuid);
    };

    const columns = [
        {
            field: 'profileId',
            headerName: 'Profile',
            width: 200,
            editable: true,
            renderCell: (params) => (
                <DropDownCell 
                    {...params}
                    getData={() => profilers || []} 
                    dataKey='id' 
                    text='name' 
                    fieldId='profileId' 
                    fieldName='profileName'
                    onClick={(profileId, itemUpdate) => onDetailSelected(
                        <ProfileDetail
                            profileId={profileId}
                            api={Api.profiles}
                            deletable={false}
                            onUpdate={itemUpdate}
                        />)
                    }
                />
            )
        },
        {
            field: 'workplaceHostDeviceId',
            headerName: 'Device',
            width: 200,
            editable: true,
            renderCell: (params) => (
                <DropDownCell 
                    {...params}
                    getData={() => devices || []} 
                    dataKey='id' 
                    text='device' 
                    fieldId='deviceId' 
                    fieldName='deviceName'
                    onChange={(e) => handleDeviceChange(e, params.onChange)}
                    onClick={(deviceId, itemUpdate) => devices && devices.length &&
                        onDetailSelected(
                            <DeviceDetail
                                deviceId={deviceId}
                                api={Api.devices}
                                path={devicesPath}
                                onClose={() => onDetailSelected()}
                                onUp={() => navigate(`${devicesPath}/${deviceId}`)}
                                onUpdate={itemUpdate}
                            />)
                    }
                />
            )
        },
        { field: 'hostName', headerName: 'Host', width: 150, editable: false },
        {
            field: 'configuration',
            headerName: 'Configuration',
            flex: 1,
            editable: false,
            renderCell: (params) => (
                <LinkTextCell 
                    {...params}
                    fieldId='id' 
                    onClick={configClick}
                    editable={false}
                    template={<span title='Edit device configuration'>Edit&hellip;</span>}
                />
            )
        }
    ];

    return (
        <RelationTable 
            api={`${api}/${id}/devices`} 
            removable 
            columns={columns}
        />
    );
}


