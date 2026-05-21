/* eslint-disable no-mixed-operators */
import React, { useState, useContext, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { 
    Container, 
    Box, 
    Typography, 
    Divider, 
    Grid, 
    Alert, 
    Button, 
    IconButton,
    Tooltip,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Paper,
    CircularProgress
} from '@mui/material';
import {
    Info as InfoIcon,
    Edit as EditIcon,
    PlayArrow as PlayIcon,
    CheckCircle as CheckCircleIcon,
    ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import api, {spaUrl} from '../api';
import {resolveError} from '../../i18n/resolveError';
import { useGet } from '@microprojects/edm-components/hooks';
import { SmartScroll, SmartScrollContent } from '@microprojects/tools';
import { Loading } from '@microprojects/edm-components/components';
import { PluginContainer } from '@microprojects/react-utils';
import { ApiContext } from '../../ApiContext';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { clearDevices, reset, setDevice, setDriverOptions, setParameters, setProcess, setProfiles, setWorkbench } from '../../slices/newOperationSlice.ts';
import axios from 'axios';
import { SubRootPage } from '@microprojects/edm-components/components';

export function NewOperationWizard() {
    const params = useSelector(s => s.newOperation)
    const dispatch = useDispatch()
    const { t } = useTranslation('tech');
    const [error, setError] = useState();
    const [started] = useState(false);
    const [[processList]] = useGet(`${api.workplaces}/processes/allowed`, [], data => {
        const flatten = (items, level = 0) => {
            return items?.reduce((acc, item) => {
                // Robust check for Workplace (HierarchyType 2)
                const isWorkplace = item.hierarchyType === 2 || 
                                    item.hierarchyType === 'Workplace' || 
                                    item.itemType === 'workplace';
                const isFolder = item.isFolder || isWorkplace;

                return [
                    ...acc,
                    { ...item, level, isFolder },
                    ...flatten(item.items, level + 1)
                ];
            }, []) || [];
        };

        let list = flatten(data);
        // Remove root node if it exists (usually id 0 or parentId 0 for the first element)
        if (list.length > 0 && (list[0].id === 0 || list[0].parentId === 0)) {
            list = list.slice(1).map(item => ({ ...item, level: Math.max(0, item.level - 1) }));
        }
        return list;
    });
    const [detail, setDetail] = useState(<ProcessDetailStub />)
    const [dynamicOffset, setDynamicOffset] = useState(10);

    const step2Disabled = !params.process;
    const step3Disabled = !(params.devices && params.options && params.profiles?.every(p => params.devices[p] && params.options[p]))
    const step4Disabled = !params.parameters || step3Disabled;

    useEffect(() => {
        const updateOffset = () => {
            const stickyHeaders = document.querySelectorAll('[data-sticky-header="true"]');
            let maxBottom = 0;
            stickyHeaders.forEach(header => {
                const rect = header.getBoundingClientRect();
                maxBottom = Math.max(maxBottom, rect.bottom);
            });
            setDynamicOffset(maxBottom + 10);
        };
        const observer = new ResizeObserver(updateOffset);
        document.querySelectorAll('[data-sticky-header="true"]').forEach(h => observer.observe(h));
        updateOffset();
        window.addEventListener('scroll', updateOffset, { passive: true });
        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', updateOffset);
        };
    }, []);

    const onProcessChange = (e) => {
        const value = e.target.value;
        dispatch(reset());
        if (!value || !value.startsWith('process-')) {
            setDetail(<ProcessDetailStub />);
            return false;
        }
        const processId = Number(value.slice('process-'.length));
        setDetail(<ProcessDetail id={processId} />);
    };

    const onOperationStart = () => {
        const data = {
            id: 0,
            workplaceProcessId: params.process.id,
            parameters: params.parameters && JSON.stringify(params.parameters),
            devices: Object.entries(params.devices).map(([profileId, device]) => {
                const id = parseInt(profileId);
                return {
                    profileId: id,
                    hostDeviceId: device.hostDeviceId,
                    options: JSON.stringify(params.options[id]?.options || {})
                }
            }),
        };
        axios.post(api.operations, data)
            .then((op) => {
                window.open(spaUrl(`/operations/${op.data.id}`), '_blank')
            })
            .catch((error) => setError(resolveError(error, t('common:error'))));
    };

    return (
        <SubRootPage
            title={t('newOperation.title')}
            menuItems={[]}
        >
            <SmartScroll offsetTop={dynamicOffset} style={{ display: "flex", flexDirection: "row", alignItems: 'flex-start', gap: 4 }}>
                <SmartScrollContent style={{ flex: 1, minWidth: '400px' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Step step={1} active={true}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                {t('newOperation.selectProcessToRun')}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>{t('newOperation.process')}</InputLabel>
                                    <Select
                                        sx={{ width: '100%' }}
                                        value={params.process ? `process-${params.process.id}` : ''}
                                        label={t('newOperation.process')}
                                        onChange={onProcessChange}
                                    >
                                        <MenuItem value=""><em>{t('newOperation.none')}</em></MenuItem>
                                        {processList?.map((p) => {
                                            const itemValue = p.isFolder ? `folder-${p.id}` : `process-${p.id}`;
                                            return (
                                                <MenuItem
                                                    key={itemValue}
                                                    value={itemValue}
                                                    disabled={p.isFolder}
                                                    sx={{
                                                        pl: (p.level || 0) * 2 + (p.isFolder ? 2 : 4),
                                                        fontWeight: p.isFolder ? 700 : 400,
                                                        color: p.isFolder ? 'text.primary' : 'inherit',
                                                        '&.Mui-disabled': {
                                                            opacity: 1,
                                                            backgroundColor: 'rgba(0,0,0,0.02)'
                                                        }
                                                    }}
                                                >
                                                    {p.name}
                                                </MenuItem>
                                            );
                                        })}
                                    </Select>
                                </FormControl>
                                {params.process && (
                                    <Tooltip title={t('newOperation.viewInfo')}>
                                        <IconButton
                                            size="small"
                                            color="info"
                                            onClick={() => setDetail(<ProcessDetail id={params.process.id} />)}
                                        >
                                            <InfoIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Box>
                        </Step>

                        <Step
                            step={2}
                            disabled={step2Disabled}
                            description={t('newOperation.selectDevicesForProcess')}
                        >
                            {!step2Disabled && (
                                <DevicesStep
                                    changeDetail={setDetail}
                                    workplaceId={params.process.workplaceId}
                                    process={params.process}
                                />
                            )}
                        </Step>

                        <Step
                            step={3}
                            disabled={step3Disabled}
                            description={t('newOperation.specifyInputs')}
                        >
                            {!step3Disabled && (
                                <InputsStep
                                    id={params.process.processId}
                                    changeDetail={setDetail}
                                />
                            )}
                        </Step>

                        <Step
                            step={4}
                            disabled={step4Disabled}
                            description={t('newOperation.startOperation')}
                        >
                            {started ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
                                    <CheckCircleIcon />
                                    <Typography>{t('newOperation.startedSuccess')}</Typography>
                                </Box>
                            ) : (
                                <Box>
                                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                                        {t('newOperation.finallyCreate')}
                                    </Typography>
                                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        fullWidth
                                        startIcon={<PlayIcon />}
                                        onClick={onOperationStart}
                                        sx={{ textTransform: 'none', py: 1 }}
                                    >
                                        {t('newOperation.createNow')}
                                    </Button>
                                </Box>
                            )}
                        </Step>
                    </Box>
                </SmartScrollContent>

                <SmartScrollContent style={{ flex: 1 }}>
                    <Paper variant="outlined" sx={{ p: 3, minHeight: '400px', backgroundColor: 'var(--surface-2)' }}>
                        {detail}
                    </Paper>
                </SmartScrollContent>
            </SmartScroll>
        </SubRootPage>
    );
}

const ProcessDetailStub = () => {
    const { t } = useTranslation('tech');
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.disabled', py: 8 }}>
            <InfoIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="body1">{t('newOperation.selectProcessToStart')}</Typography>
        </Box>
    );
};

const ProcessDetail = ({ id }) => {
    const process = useSelector(state => state.newOperation.process)
    const dispatch = useDispatch()
    const { t } = useTranslation('tech');
    useGet(`${api.workplaces}/processes/${id}`, [], data => {
        dispatch(setProcess(data))
    })
    if (!process) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
    return (
        <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>{t('newOperation.selectedProcessInfo')}</Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>{t('common.name')}</Typography>
                    <Typography variant="body2">{process.processName}</Typography>
                </Box>
                <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>{t('common.description')}</Typography>
                    <Typography variant="body2">{process.processDescription || '—'}</Typography>
                </Box>
            </Box>
        </Box>
    );
}

function Step({ step, children, disabled, description, active }) {
    const { t } = useTranslation('tech');
    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2,
                opacity: disabled ? 0.5 : 1,
                pointerEvents: disabled ? 'none' : 'auto',
                borderLeft: active || !disabled ? '4px solid var(--accent)' : undefined,
                transition: 'all 0.2s'
            }}
        >
            <Grid container spacing={2}>
                <Grid item sx={{ display: 'flex', alignItems: 'flex-start', pt: '4px !important' }}>
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 700,
                            color: disabled ? 'text.disabled' : 'primary.main',
                            lineHeight: 1,
                            width: '24px'
                        }}
                    >
                        {step}
                    </Typography>
                </Grid>
                <Grid item xs sx={{width:'80%'}}>
                    {disabled ? (
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                            {description || t('newOperation.selectOptionsAbove')}
                        </Typography>
                    ) : children}
                </Grid>
            </Grid>
        </Paper>
    );
}

function DevicesStep({ changeDetail }) {
    const process = useSelector(state => state.newOperation.process)
    const workbench = useSelector(state => state.newOperation.workbench)
    const dispatch = useDispatch()
    const { t } = useTranslation('tech');
    const [[workbenches]] = useGet(`${api.workplaces}/processes/${process.id}/workbenches`)
    const [[profiles]] = useGet(`${api.processes}/${process.processId}/profiles`, [], data => {
        dispatch(setProfiles(data.map(p => p.id)))
    })

    const workbenchChosen = (w) => {
        axios.get(`${api.workplaces}/processes/workbenches/${w.id}/devices`).then(response => {
            dispatch(clearDevices())
            dispatch(setWorkbench(w))
            response.data.forEach(d => {
                dispatch(setDevice({
                    profileId: d.profileId,
                    id: d.workplaceHostDeviceId,
                    hostDeviceId: d.hostDeviceId,
                    device: d.deviceName
                }))
                dispatch(setDriverOptions({ 
                    id: d.id, 
                    profileId: d.profileId,
                    options: JSON.parse(d.configuration || '{}'),
                    output: JSON.parse(d.profileOutput || '[]') 
                }))
            })
        })
    }

    useEffect(() => {
        if (workbench) workbenchChosen(workbench);
    }, []);

    if (!profiles || !workbenches) return <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}><CircularProgress size={16} /><Typography variant="caption">{t('newOperation.loadingProfiles')}</Typography></Box>

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {profiles.length > 0 ?
                    t('newOperation.chooseWorkbench', { count: profiles.length }) :
                    t('newOperation.doesNotRequireDevice', { processName: process.processName })
                }
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {workbenches?.length > 0 && (
                    <FormControl fullWidth size="small">
                        <InputLabel>{t('newOperation.workbench')}</InputLabel>
                        <Select
                            value={workbench?.id || ''}
                            label={t('newOperation.workbench')}
                            onChange={(e) => {
                                const w = workbenches.find(item => item.id === e.target.value);
                                workbenchChosen(w);
                            }}
                        >
                            {workbenches.map(w => (
                                <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
                {profiles.map((el) => (
                    <DeviceDropDown
                        key={el.id}
                        api={`${api.workplaces}/${process.workplaceId}/devices/${el.profilerGuid}`}
                        type={el.profilerName}
                        profileId={el.id}
                        onChange={(device) => {
                            changeDetail(
                                <DeviceDetail
                                    id={device.id}
                                    profile={el}
                                />
                            )
                        }}
                    />
                ))}
            </Box>
        </Box>
    );
}

function InputsStep({ id, changeDetail }) {
    const [[inputs]] = useGet(`${api.processes}/${id}/inputs`)
    const dispatch = useDispatch()
    const { t } = useTranslation('tech');

    useEffect(() => {
        if (inputs) {
            if (inputs.length) {
                changeDetail(<InputsDetail inputs={inputs} />)
            } else {
                dispatch(setParameters({}))
            }
        }
    }, [inputs, changeDetail, dispatch])

    if (!inputs) return <Typography variant="body2">{t('newOperation.checkMissingInputs')}</Typography>
    if (!inputs.length) return <Typography variant="body2">{t('newOperation.noMissingParameters')}</Typography>

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2">
                {t('newOperation.specifyInputCount', { count: inputs.length })}
            </Typography>
            <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
                onClick={() => changeDetail(<InputsDetail inputs={inputs} />)}
                sx={{ textTransform: 'none', borderRadius: '4px' }}
            >
                {t('newOperation.editParameters')}
            </Button>
        </Box>
    );
}

function DeviceDropDown({ api, type, profileId, onChange }) {
    const device = useSelector(state => state.newOperation.devices[profileId])
    const [[data]] = useGet(api);
    const { t } = useTranslation('tech');

    return (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FormControl fullWidth size="small">
                <InputLabel>{type}</InputLabel>
                <Select
                    value={device?.id || ''}
                    label={type}
                    onChange={(e) => {
                        const selected = data.find(d => d.id === e.target.value);
                        onChange(selected);
                    }}
                >
                    {data?.map(d => (
                        <MenuItem key={d.id} value={d.id}>{d.device}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            {device && (
                <Tooltip title={t('newOperation.editOptions')}>
                    <IconButton
                        size="small"
                        color="primary"
                        onClick={() => onChange(device)}
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}
        </Box>
    );
}

function DeviceDetail({ id, profile }) {
    const device = useSelector(state => state.newOperation.devices[profile.id])
    const options = useSelector(state => state.newOperation.options[profile.id])
    const dispatch = useDispatch()
    const apiContext = useContext(ApiContext)
    const { t } = useTranslation('tech');

    useGet(`${api.workplaces}/devices/${id}`, [], data => {
        dispatch(setDevice({ profileId: profile.id, ...data }))
        if (!options || Object.entries(options).length === 0) {
            dispatch(setDriverOptions({ 
                id, 
                profileId: profile.id, 
                options: JSON.parse(data.configuration || "{}"),
                output: JSON.parse(data.profileOutput || '[]')
            }))
        }
    })

    if (!device) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>

    return (
        <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>{t('newOperation.selectedDeviceInfo')}</Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>{t('common.device')}</Typography>
                        <Typography variant="body2">{device.device}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>{t('common.model')}</Typography>
                        <Typography variant="body2">{device.driverName}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>{t('common.type')}</Typography>
                        <Typography variant="body2">{device.profilerName}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>{t('common.host')}</Typography>
                        <Typography variant="body2">{device.host}</Typography>
                    </Grid>
                </Grid>
            </Box>
            <Box sx={{ mt: 2 }}>
                <PluginContainer
                    title={t('newOperation.deviceConfiguration')}
                    data={options}
                    width="100%"
                    src={`${apiContext}/${device.driverHomepage}/options`}
                    onDataReceived={o => dispatch(setDriverOptions(o))}
                />
            </Box>
        </Box>
    );
}

function InputsDetail({ inputs }) {
    const parameters = useSelector(state => state.newOperation.parameters)
    const [localParams, setLocalParams] = useState(parameters || {});
    const dispatch = useDispatch()
    const { t } = useTranslation('tech');

    const handleInputChange = (name, value) => {
        setLocalParams(prev => ({ ...prev, [name]: value }));
    };

    const handleAccept = () => {
        dispatch(setParameters(localParams));
    };

    return (
        <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>{t('newOperation.missingInputs')}</Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {inputs.map((i) => (
                    <TextField
                        key={i}
                        fullWidth
                        label={i}
                        value={localParams[i] || ''}
                        onChange={(e) => handleInputChange(i, e.target.value)}
                        size="small"
                    />
                ))}
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CheckCircleIcon />}
                    onClick={handleAccept}
                    sx={{ mt: 2, textTransform: 'none', borderRadius: '4px' }}
                >
                    {t('newOperation.acceptParameters')}
                </Button>
            </Box>
        </Box>
    );
}
