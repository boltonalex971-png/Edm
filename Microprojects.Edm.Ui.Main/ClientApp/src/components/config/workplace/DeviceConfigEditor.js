import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useGet } from '../../hooks/hooks';
import { Detail } from '../../MasterDetail';
import { LoadingContainer } from '../../utils/Utils';
import { ApiContext } from '../../../ApiContext';
import { PluginContainer } from '@microprojects/react-utils';
import axios from 'axios';

DeviceConfigEditor.propTypes = {
    onChange: PropTypes.func,
    path: PropTypes.string,
    api: PropTypes.string,
    id: PropTypes.number
}

export function DeviceConfigEditor({ id, ...props }) {
    const location = useContext(ApiContext);
    let [[data]] = useGet(`${props.api}/${id}`, [id], (o) => ({
        ...o,
        name: `${o.deviceName} configuration`,
        description: `${o.driverName} device on ${o.hostName}`,
        options: JSON.parse(o.configuration || '{}'),
        output: JSON.parse(o.profileOutput || '[]')
    }))
    const onOptionsChanged = (o) => {
        axios.put(`${props.api}/${id}`, o)
    }

    return (
        <>
            {data && <Detail {...props}
                data={data}
                card={
                    <div>
                        <PluginContainer title='Device Configuration'
                            data={data}
                            width='100%'
                            src={`${location}/${data.driverHomepage}/options`}
                            onDataReceived={onOptionsChanged}
                        />
                    </div>
                }
            />}
        </>
    );
}

