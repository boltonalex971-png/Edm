import React, { useCallback, useContext, useEffect, useState } from 'react';
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
import { ApiContext } from '../../../ApiContext';
import { IFrame } from '@microprojects/react-utils';

DeviceConfigEditor.propTypes = {
    onChange: PropTypes.func,
    path: PropTypes.string,
    api: PropTypes.string,
    id: PropTypes.number
}

export function DeviceConfigEditor({ id, ...props }) {
    const location = useContext(ApiContext);
    let [[data, setData], loading, error] = useGet(`${props.api}/${id}`, [id]);
    data = data && data.id ?
        { ...data, name: `${data.deviceName} configuration`, description: `${data.driverName} device on ${data.hostName}` } :
        { name: ' ', description: ' ' };
    const options = JSON.parse(data.configuration || '{}');
    const arg = data && JSON.stringify({ api: `${props.api}/${id}`, options, output: JSON.parse(data.profileOutput || '[]') });
    const [iframeLoading, setIframeLoading] = useState(true);
    if (!iframeLoading && loading) setIframeLoading(true);
    const onLoad = () => {
        setIframeLoading(false)
        // Auto-adjust is not working in debug mode, causing to browser cross-origin exception
        //setHeight(ref.current.contentWindow.document.body.scrollHeight + "px");
    };

    return (
        <Detail {...props}
            data={data}
            card={
                <div>
                    <LoadingContainer loading={iframeLoading || loading}>
                        {!loading &&
                            <IFrame title='Device Configuration'
                                width='100%'
                                src={`${location}/${data.driverHomepage}/options?${new URLSearchParams({ a: arg })}`}
                                onLoad={onLoad}
                            />
                        }
                    </LoadingContainer>
                </div>
            }
        />
    );
}

