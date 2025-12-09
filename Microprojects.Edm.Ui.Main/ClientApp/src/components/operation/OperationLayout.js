import React, {useState} from 'react';
import {useParams} from 'react-router-dom'
import {useGet} from '../hooks/hooks';
import api from '../api';
import {OperationPluginContainer} from './OperationPluginContainer';
import {OperationMenu} from './OperationMenu.js';
import {Button} from '@progress/kendo-react-buttons';
import axios from 'axios';

export function OperationLayout() {
    const {id} = useParams()
    const [options, setOptions] = useState()
    const [[info]] = useGet(`${api.operations}/${id}/info`, [id], (oi) => {
        axios.get(`${api.plugins}/${oi.process.appGuid}`).then(d => setOptions(d.data)).catch(alert)
    });
    const [to, setTo] = useState('')
    const [hidden, setHidden] = useState(false)
    const saveSettings = (msg) => msg.type === 'Settings' && axios.put(`${api.operations}/${id}/settings`, msg.data)
    
    return (
        <>
            {(info && options) &&
                <div className='mx-2' style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
                    <Button
                        fillMode={'flat'}
                        icon={hidden ? 'arrow-60-down' : 'arrow-60-up'}
                        onClick={() => setHidden((h) => !h)}
                        style={{position: 'absolute', top: 8, right: 15, opacity: 90, zIndex: 1}}
                    ></Button>
                    <div style={{display: hidden ? 'none' : 'inherit'}}>
                        <OperationMenu
                            operation={info}
                            to={setTo}
                        />
                    </div>
                    <div style={{flex: 'auto', display: 'flex'}}>
                        <OperationPluginContainer
                            title='Operation Console'
                            id={id}
                            info={info}
                            navigate={to}
                            src={`${api.baseUrl}/${options.homepage}?id=${id}`}
                            onMessage={saveSettings}
                        />
                    </div>
                    <div style={{display: hidden ? 'none' : ''}}>
                        <footer>
                            <hr style={{margin: '2px'}}/>
                            <span>&#169; Microprojects {new Date().getFullYear()}</span>
                        </footer>
                    </div>
                </div>
            }
        </>
    )
}

