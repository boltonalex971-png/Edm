import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useGet } from '@microprojects/edm-components/hooks';
import { Detail } from '@microprojects/edm-components/components';
import { LoadingContainer } from '@microprojects/edm-components/components';
import { useTranslation } from 'react-i18next';
import { ApiContext } from '../../../ApiContext';
import { PluginContainer } from '@microprojects/react-utils';
import { Tune as TuneIcon } from '@mui/icons-material';
import axios from 'axios';

DeviceConfigEditor.propTypes = {

    onChange: PropTypes.func,
    path: PropTypes.string,
    api: PropTypes.string,
    id: PropTypes.number
}

export function DeviceConfigEditor({ id, ...props }) {
    const location = useContext(ApiContext);
    const { t } = useTranslation('tech');
    let [[data]] = useGet(`${props.api}/${id}`, [id], (o) => ({
        ...o,
        name: t('device.deviceNameConfig', { deviceName: o.deviceName }),
        description: t('device.deviceOnHost', { driverName: o.driverName, hostName: o.hostName }),
        options: JSON.parse(o.configuration || '{}'),
        output: JSON.parse(o.profileOutput || '[]')
    }))
    const onOptionsChanged = (o) => {
        axios.put(`${props.api}/${id}`, o.options)
    }

    return (
        <>
            {data && <Detail {...props}
                type='device'
                icon={<TuneIcon />}
                data={data}

                card={
                    <div>
                        <PluginContainer title={t('device.config')}
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

