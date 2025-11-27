import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'
import { useGet } from '../hooks/hooks';
import { ApiContext } from '../../ApiContext';
import api from '../api';
import { OperationPluginContainer } from './OperationPluginContainer';
import { OperationMenu } from './OperationMenu';
import { Button } from '@progress/kendo-react-buttons';
import axios from 'axios';

export function OperationLayout() {
    const { id } = useParams()
    const apiContext = useContext(ApiContext)
    const [options, setOptions] = useState()
    const [[data]] = useGet(`${api.operations}/${id}/process`, [], p => {
        axios.get(`${api.plugins}/${p.operationGuid}`).then(d => setOptions(d.data)).catch(alert)
    })
    // const [[options]] = useGet(`${api.plugins}/${data?.operationGuid}`)
    const [[processInfo]] = useGet(`${api.operations}/${id}/processInfo`);
    const [settings, setSettings] = useState();
    const [started, setStarted] = useState();
    const [to, setTo] = useState('')
    const [hidden, setHidden] = useState(false)
    const onStarted = () => setStarted(true)
    const onFinished = () => setStarted(false)
    useEffect(() => {
        if (processInfo && !settings) {
            setSettings(processInfo.settings && JSON.parse(processInfo.settings));
        }
    }, [processInfo, settings]);
    return (
        <>
            {(data && options) &&
                <div className='mx-2' style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
                    <Button
                        fillMode={'flat'}
                        icon={hidden ? 'arrow-60-down' : 'arrow-60-up'}
                        onClick={() => setHidden((h) => !h)}
                        style={{ position: 'absolute', top: 8, right: 15, opacity: 90, zIndex: 1 }}
                    ></Button>
                    <div style={{ display: hidden ? 'none' : 'inherit' }}>
                        <OperationMenu
                            apiBase={api.operations}
                            operationId={id}
                            process={processInfo}
                            to={setTo}
                            onStarted={onStarted}
                            onCompleted={onFinished}
                            onCancelled={onFinished}
                        />
                    </div>
                    <div style={{ flex: 'auto', display: 'flex' }} >
                        <OperationPluginContainer title='Operation Console'
                            started={started}
                            data={options}
                            width='100%'
                            src={`${api.baseUrl}/${options.homepage}/${to}?id=${id}`}
                        />
                    </div>
                    <div style={{ display: hidden ? 'none' : '' }}>
                        <footer >
                            <hr style={{ margin: '2px' }} />
                            <span>&#169; Microprojects {new Date().getFullYear()}</span>
                        </footer>
                    </div>
                </div>
            }
        </>
    )
}

