import React from 'react';
import Api from '../../api';
import PropTypes from 'prop-types';
import { RelationTable } from '@microprojects/edm-components/components';
import { DropDownCell, LinkTextCell } from '@microprojects/edm-components/components';
import { useGet } from '@microprojects/edm-components/hooks';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DeviceDetail } from '../Devices';
import { DeviceConfigEditor } from './DeviceConfigEditor';
import { ProfileDetail } from '../Profiles';
import { HostDetail } from '../Hosts';

WorkbenchDevicesTab.propTypes = {
    id: PropTypes.string,
    processId: PropTypes.string,
    api: PropTypes.string,
    onDetailSelected: PropTypes.func
}

export function WorkbenchDevicesTab({ id, api, processId, onDetailSelected }) {
    const navigate = useNavigate();
    const { t } = useTranslation('tech');
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
            headerName: t('workbench.profile'),
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
            headerName: t('common.device'),
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
        {
            field: 'hostName',
            headerName: t('common.host'),
            width: 150,
            editable: false,
            renderCell: (params) => (
                <LinkTextCell
                    {...params}
                    fieldId='hostId'
                    editable={false}
                    onClick={(hostId, itemUpdate) => {
                        const path = '/config/hosts';
                        onDetailSelected(
                            <HostDetail
                                hostId={hostId}
                                api={Api.hosts}
                                path={path}
                                onClose={() => onDetailSelected()}
                                onUp={() => navigate(`${path}/${hostId}`)}
                                onUpdate={itemUpdate}
                            />
                        );
                    }}
                />
            )
        },
        {
            field: 'configuration',
            headerName: t('device.configurationLabel'),
            flex: 1,
            editable: false,
            renderCell: (params) => (
                <LinkTextCell
                    {...params}
                    fieldId='id'
                    onClick={configClick}
                    editable={false}
                    template={<span title={t('device.editConfig')}>{t('common.edit')}</span>}
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


