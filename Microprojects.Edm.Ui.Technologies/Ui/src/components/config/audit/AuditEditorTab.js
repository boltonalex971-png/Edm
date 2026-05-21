import React, { useState } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper,
    IconButton,
    Tooltip,
    Box,
    Typography,
    Fab,
    CircularProgress,
    Alert,
    Button,
    Divider,
    Link
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { useGet } from '@microprojects/edm-components/hooks';
import { Loading } from '@microprojects/edm-components/components';
import { useTranslation } from 'react-i18next';
import { CriterionEditor, ZoneEditor } from './AuditZoneEditor';

AuditEditorTab.propTypes = {
    id: PropTypes.number,
    api: PropTypes.string,
    params: PropTypes.array
}

export function AuditEditorTab({ id, api, params }) {
    const [[functions]] = useGet(`${api}/functions`, []);
    const [[zones, setZones], loading, error] = useGet(`${api}/${id}/zones`, [id]);
    const [hoveredCell, setHoveredCell] = useState(null);
    const [showCriterionEditor, setShowCriterionEditor] = useState();
    const [showZoneEditor, setShowZoneEditor] = useState();
    const { t } = useTranslation('tech');

    let parameters = zones && [...new Set(zones.flatMap(z => (z.criteria || []).map(p => p.param)))].sort((a, b) => `${a}`.localeCompare(`${b}`));
    parameters = (parameters && parameters.length) ? parameters : [' '];

    const getCriteria = (param, zone) => zone.criteria && zone.criteria.filter(c => c.param === param) || [];
    
    const addZone = () => {
        axios.post(`${api}/${id}/zones`, {}).then((response) => {
            setZones([response.data, ...zones]);
        });
    };

    const saveZone = (data) => {
        axios.put(`${api}/zones/${data.id}`, data).then((response) => {
            const newZones = zones.map(z => z.id === response.data.id ? { ...z, ...response.data } : z);
            toggleZoneEditor();
            setZones(newZones);
        });
    };

    const deleteZone = (data) => {
        axios.delete(`${api}/zones/${data.id}`).then(() => {
            const newZones = zones.filter(z => z.id !== data.id);
            toggleZoneEditor();
            setZones(newZones);
        });
    };

    const addCriterion = (criterion) => {
        if (criterion.id) {
            axios.put(`${api}/criteria/${criterion.id}`, criterion).then((response) => {
                const newZones = zones.map(z => {
                    if (z.id === response.data.zoneId) {
                        const index = z.criteria.findIndex(c => c.id === criterion.id);
                        const newCriteria = [...z.criteria];
                        newCriteria[index] = response.data;
                        return { ...z, criteria: newCriteria };
                    }
                    return z;
                });
                toggleCriterionEditor();
                setZones(newZones);
            });
        } else {
            axios.post(`${api}/zones/${criterion.zoneId}/criteria`, { ...criterion, id: 0 }).then((response) => {
                const newZones = zones.map(z => {
                    if (z.id === response.data.zoneId) {
                        return { ...z, criteria: z.criteria ? [response.data, ...z.criteria] : [response.data] };
                    }
                    return z;
                });
                toggleCriterionEditor();
                setZones(newZones);
            });
        }
    };

    const deleteCriterion = (criterion) => {
        axios.delete(`${api}/criteria/${criterion.id}`, criterion).then(() => {
            const newZones = zones.map(z => {
                if (z.id === criterion.zoneId) {
                    return { ...z, criteria: z.criteria.filter(c => c.id !== criterion.id) };
                }
                return z;
            });
            toggleCriterionEditor();
            setZones(newZones);
        });
    };

    const toggleCriterionEditor = (target) => {
        setShowZoneEditor();
        setShowCriterionEditor(target);
    };

    const toggleZoneEditor = (target) => {
        setShowCriterionEditor();
        setShowZoneEditor(target);
    };

    const funcFormat = (c) => {
        const func = functions?.filter(f => f.name === c.function)[0];
        const format = func ?
            func.format.replace('{0}', c.arg1).replace('{1}', c.arg2) :
            `${c.function}(${c.arg1 || ''}, ${c.arg2 || ''})`;
        return format;
    };

    if (error) return <Alert severity="error">{error}</Alert>;
    if (loading && !zones) return <Loading />;

    return (
        <Box>
            {showCriterionEditor &&
                <CriterionEditor 
                    data={showCriterionEditor} 
                    functions={functions || []} 
                    params={params || []}
                    onClose={() => toggleCriterionEditor()}
                    onSave={addCriterion}
                    onDelete={deleteCriterion}
                />
            }
            {showZoneEditor &&
                <ZoneEditor 
                    data={showZoneEditor}
                    onClose={() => toggleZoneEditor()}
                    onSave={saveZone}
                    onDelete={deleteZone}
                />
            }

            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
                <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={addZone}
                    sx={{ textTransform: 'none', borderRadius: '4px' }}
                >
                    {t('audit.addZone')}
                </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '4px', boxShadow: 'none' }}>
                <Table size="small" aria-label={t('audit.zonesTable')}>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: 'var(--surface-2)' }}>
                            <TableCell colSpan={3} align="center" sx={{ fontWeight: 700, borderRight: '1px solid var(--line)', fontSize: '12px', py: 1 }}>{t('audit.tableZone')}</TableCell>
                            <TableCell colSpan={parameters.length} align="center" sx={{ fontWeight: 700, fontSize: '12px', py: 1 }}>{t('audit.tableParameters')}</TableCell>
                        </TableRow>
                        <TableRow sx={{ backgroundColor: 'var(--surface-2)' }}>
                            <TableCell sx={{ fontWeight: 600, fontSize: '11px', width: 50 }}>#</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '11px', width: 120 }}>{t('audit.tableInterval')}</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '11px', borderRight: '1px solid var(--line)' }}>{t('audit.tableActiveWhen')}</TableCell>
                            {parameters.map(p => (
                                <TableCell key={p} sx={{ fontWeight: 600, fontSize: '11px' }}>{p}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {zones?.sort((a, b) => a.offset - b.offset).map((zone) => (
                            <TableRow key={zone.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                <TableCell 
                                    onClick={() => toggleZoneEditor(zone)} 
                                    sx={{ cursor: 'pointer', color: 'primary.main', fontWeight: 500 }}
                                >
                                    {zone.no}
                                </TableCell>
                                <TableCell 
                                    onClick={() => toggleZoneEditor(zone)} 
                                    sx={{ cursor: 'pointer' }}
                                >
                                    <Typography variant="body2" sx={{ fontSize: '13px' }}>
                                        {`${zone.offset} : ${zone.offset + zone.duration}`}
                                    </Typography>
                                </TableCell>
                                <TableCell 
                                    onClick={() => toggleZoneEditor(zone)} 
                                    sx={{ cursor: 'pointer', borderRight: '1px solid var(--line)' }}
                                >
                                    <Typography variant="body2" sx={{ fontSize: '13px' }}>
                                        {zone.activeWhen}
                                    </Typography>
                                </TableCell>
                                {parameters.map(p => (
                                    <TableCell 
                                        key={p} 
                                        onMouseEnter={() => setHoveredCell(`${zone.id}-${p}`)}
                                        onMouseLeave={() => setHoveredCell(null)}
                                        sx={{ position: 'relative', minWidth: 120 }}
                                    >
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            {getCriteria(p, zone).map(c => (
                                                <Box key={c.id}>
                                                    <Link
                                                        component="button"
                                                        variant="body2"
                                                        onClick={() => toggleCriterionEditor(c)}
                                                        sx={{ 
                                                            fontSize: '12px', 
                                                            textAlign: 'left', 
                                                            textDecoration: 'none',
                                                            color: 'primary.main',
                                                            '&:hover': { textDecoration: 'underline' }
                                                        }}
                                                    >
                                                        {funcFormat(c)}
                                                    </Link>
                                                </Box>
                                            ))}
                                        </Box>
                                        {hoveredCell === `${zone.id}-${p}` && (
                                            <Fab 
                                                size="small" 
                                                color="primary" 
                                                sx={{ 
                                                    position: 'absolute', 
                                                    right: 4, 
                                                    top: '50%', 
                                                    transform: 'translateY(-50%)',
                                                    width: 32,
                                                    height: 32,
                                                    minHeight: 32
                                                }}
                                                onClick={() => toggleCriterionEditor({ zoneId: zone.id, param: p })}
                                            >
                                                <AddIcon fontSize="small" />
                                            </Fab>
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}


