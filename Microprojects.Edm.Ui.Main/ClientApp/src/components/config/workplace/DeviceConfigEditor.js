import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useGet } from '../../hooks/hooks';
import { Detail } from '../../MasterDetail';
import { LoadingContainer } from '../../utils/Utils';
import { ApiContext } from '../../../ApiContext';
import { PluginContainer } from '@microprojects/react-utils';

DeviceConfigEditor.propTypes = {
    onChange: PropTypes.func,
    path: PropTypes.string,
    api: PropTypes.string,
    id: PropTypes.number
}

export function DeviceConfigEditor({ id, ...props }) {
    const location = useContext(ApiContext);
    let [[data, setData], loading, error] = useGet(`${props.api}/${id}`, [id]);
    const header = data && data.id ?
        { ...data, name: `${data.deviceName} configuration`, description: `${data.driverName} device on ${data.hostName}` } :
        { name: ' ', description: ' ' };
    const arg = data && {
        api: `${props.api}/${id}`,
        options: JSON.parse(data.configuration || '{}'),
        output: JSON.parse(data.profileOutput || '[]')
    };
    console.log(data, arg);
    return (
        <>
            {data && <Detail {...props}
                data={header}
                card={
                    <div>
                        <PluginContainer title='Device Configuration'
                            data={arg || {}}
                            width='100%'
                            src={`${location}/${data.driverHomepage}/options`}
                        />
                    </div>
                }
            />}
        </>
    );
}

