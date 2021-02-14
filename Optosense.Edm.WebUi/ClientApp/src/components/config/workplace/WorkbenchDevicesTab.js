import React from 'react';
import Api from '../../api';
import PropTypes from 'prop-types';
import { GridColumn } from '@progress/kendo-react-grid';
import { RelationTable } from '../../RelationTable';
import { dropDownCell, linkTextCell } from '../../DropDownCell';
import { useGet } from '../../hooks/hooks';
import { ProcessDetail } from '../Processes';
import { useHistory } from 'react-router-dom';
import { DeviceDetail } from '../Devices';
import { DeviceConfigEditor } from './DeviceConfigEditor';

WorkbenchDevicesTab.propTypes = {
    id: PropTypes.number,
    workplaceId: PropTypes.number,
    api: PropTypes.string,
    onDetailSelected: PropTypes.func
}

export function WorkbenchDevicesTab({ id, api, workplaceId, onDetailSelected }) {
    const history = useHistory();
    const [[data]] = useGet(`${Api.workplaces}/${workplaceId}/devices`, [workplaceId]);
    const wbClick = (wbId) => {
        alert(wbId);
        //onDetailSelected(
        //    <WorkbenchDetail
        //        workbenchId={wbId}
        //        api={Api.workbenches}
        //        onClose={() => onDetailSelected()}
        //    />
        //);
    };
    const configClick = (id) => {
        onDetailSelected(
            <DeviceConfigEditor
                id={id}
                api={`${api}/devices`}
                onClose={() => onDetailSelected()}
            />
        );
    };
    return (
        <RelationTable api={`${api}/${id}/devices`} removable >
            <GridColumn title='Type' field='deviceType' editable={false} />
            {data && data.length &&
                <GridColumn title='Device' field='workplaceHostDeviceId' editable={true} width={200}
                cell={dropDownCell({
                    getData: () => data, key: 'id', text: 'device', fieldId: 'deviceId',
                    onClick: (deviceId) => {
                        const path = '/config/devices';
                        onDetailSelected(
                            <DeviceDetail
                                deviceId={deviceId}
                                api={Api.devices}
                                path={path}
                                onClose={() => onDetailSelected()}
                                onUp={() => history.push(`${path}/${deviceId}`)}
                            />);
                    }
                    })}
                />
            }
            <GridColumn title='Host' field='hostName' editable={false} />
            <GridColumn title='Configuration' field='configuration' editable={false}
                cell={linkTextCell({
                    fieldId: 'id', onClick: configClick,
                    editable: false,
                    template:
                        <span title='Edit device configuration'>Edit&hellip;</span>
                })}
            />
        </RelationTable>
    );
}

