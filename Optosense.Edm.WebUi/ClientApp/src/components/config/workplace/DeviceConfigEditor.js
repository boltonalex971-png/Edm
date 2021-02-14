import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useGet } from '../../hooks/hooks';
import { Field } from '@progress/kendo-react-form';
import { Input, NumericTextBox } from '@progress/kendo-react-inputs';
import { useHistory, useParams } from 'react-router-dom';
import { useRouteMatch } from 'react-router-dom';
import { MasterDetail, reloadMaster, Detail, Info, Editor } from '../../MasterDetail';
import { TabStrip, TabStripTab } from '@progress/kendo-react-layout';
import { ProcessWorkbenchesTab } from './ProcessWorkbenchesTab';
import { LoadingContainer } from '../../utils/Utils';

DeviceConfigEditor.propTypes = {
    onChange: PropTypes.func,
    path: PropTypes.string,
    api: PropTypes.string,
    id: PropTypes.number
}

export function DeviceConfigEditor({ id, ...props }) {
    let [[data, setData], loading, error] = useGet(`${props.api}/${id}`, [id]);
    data = data && data.id ?
        { name: `${data.deviceName} configuration`, description: `${data.deviceType} device on ${data.hostName}` } :
        { name: ' ', description: ' ' };
    const arg = btoa({ api: props.api, config: data.configuration });
    const [iframeLoading, setIframeLoading] = useState(true);
    return (
        <Detail {...props}
            data={data}
            card={
                <div>
                    <LoadingContainer loading={iframeLoading && loading}>
                        <iframe id='config-iframe' height='300' width='100%' seamless frameBorder='0'
                            src={`/app/test?a=${arg}`}
                            onLoad={() => setIframeLoading(false)}
                        />
                    </LoadingContainer>
                </div>
            }
        />
    );
}

