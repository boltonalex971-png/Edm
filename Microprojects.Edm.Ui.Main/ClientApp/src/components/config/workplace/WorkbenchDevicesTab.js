import React, { useState } from 'react';
import Api from '../../api';
import PropTypes from 'prop-types';
import { GridColumn } from '@progress/kendo-react-grid';
import { RelationTable } from '../../RelationTable';
import { DropDownCell, LinkTextCell } from '../../DropDownCell';
import { useGet } from '../../hooks/hooks';
import { ProcessDetail } from '../Processes';
import { useHistory } from 'react-router-dom';
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
    const history = useHistory();
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

    return (
        <RelationTable api={`${api}/${id}/devices`} removable >
            <GridColumn title='Profile' field='profileId' editable={true} width={200}
                cell={(cellProps) =>
                    <DropDownCell {...cellProps}
                        getData={() => profilers} id='id' text='name' fieldId='profileId'
                        onClick={(profileId) => onDetailSelected(
                            <ProfileDetail
                                profileId={profileId}
                                api={Api.profiles}
                                deletable={false}
                            />)
                        }
                    />
                }
            />
            {devices && devices.length &&
                <GridColumn title='Device' field='workplaceHostDeviceId' editable={true} width={200}
                    cell={(cellProps) =>
                        <DropDownCell {...cellProps}
                            getData={() => devices} id='id' text='device' fieldId='deviceId'
                            onChange={(e) => handleDeviceChange(e, cellProps.onChange)}
                            onClick={(deviceId) => onDetailSelected(
                                <DeviceDetail
                                    deviceId={deviceId}
                                    api={Api.devices}
                                    path={devicesPath}
                                    onClose={() => onDetailSelected()}
                                    onUp={() => history.push(`${devicesPath}/${deviceId}`)}
                                />)
                            }
                        />
                    }
                />
            }
            <GridColumn title='Host' field='hostName' editable={false} />
            <GridColumn title='Configuration' field='configuration' editable={false}
                cell={(cellProps) =>
                    <LinkTextCell {...cellProps}
                        fieldId='id' onClick={configClick}
                        editable={false}
                        template={<span title='Edit device configuration'>Edit&hellip;</span>}
                    />
                }
            />
        </RelationTable>
    );
}

