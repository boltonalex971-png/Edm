import React, {useState} from 'react';
import {useParams} from 'react-router-dom'
import {useTranslation} from 'react-i18next';
import {useGet} from '@microprojects/edm-components/hooks';
import api from '../api';
import {OperationPluginContainer} from './OperationPluginContainer';
import {OperationMenu} from './OperationMenu.js';
import {KeyboardArrowDown as ArrowDownIcon} from '@mui/icons-material';
import axios from 'axios';
import styles from './OperationLayout.module.scss';

// HANDOFF · v2 PAT-03 · operator workstation. Force `data-role="op"`
// (green accent), `data-scheme="dark"` (operator default per spec — kept
// at "light" for now since dark token overlays aren't keyed off the
// attribute yet, see `styles/scheme.ts` PENDING note), and `density-compact`
// so the chrome around the operation plugin iframe stays out of the way.
// Skip the regular plugin chrome — the operator console is a single-job
// screen, not a browser of entities.

export function OperationLayout() {
    const {id} = useParams()
    const {t} = useTranslation('tech');
    const [options, setOptions] = useState()
    const [[info]] = useGet(`${api.operations}/${id}/info`, [id], (oi) => {
        axios.get(`${api.plugins}/${oi.process.appGuid}`).then(d => setOptions(d.data)).catch(alert)
    });
    const [to, setTo] = useState('')
    const [hidden, setHidden] = useState(false)
    const saveSettings = (msg) => msg.type === 'Settings' && axios.put(`${api.operations}/${id}/settings`, msg.data)

    return (
        <div
            className={`${styles.shell} density-compact`}
            data-role="op"
            data-scheme="light"
            data-plugin="technologies"
        >
            {(info && options) && (
                <>
                    <OperationMenu
                        operation={info}
                        to={setTo}
                        collapsed={hidden}
                        onCollapse={() => setHidden(true)}
                    />

                    <button
                        type="button"
                        className={styles.collapseFloat}
                        data-visible={hidden ? 'true' : 'false'}
                        onClick={() => setHidden(false)}
                        title={t('operation.showToolbar')}
                        aria-label={t('operation.showToolbar')}
                        tabIndex={hidden ? 0 : -1}
                    >
                        <ArrowDownIcon fontSize="small" />
                    </button>

                    <div className={styles.body}>
                        <OperationPluginContainer
                            title={t('operation.console')}
                            id={id}
                            info={info}
                            navigate={to}
                            src={`${api.baseUrl}/${options.homepage}?id=${id}`}
                            onMessage={saveSettings}
                        />
                    </div>
                </>
            )}
        </div>
    )
}
