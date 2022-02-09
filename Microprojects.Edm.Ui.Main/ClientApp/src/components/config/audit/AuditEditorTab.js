import React, { useState } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { Grid, GridCell, GridColumn, GridToolbar } from '@progress/kendo-react-grid';
import { FloatingActionButton } from '@progress/kendo-react-buttons';
import { useGet } from '../../hooks/hooks';
import { Alert } from 'bootstrap';
import { Loading } from '../../utils/Utils';
import { Button } from 'reactstrap';
import { CriterionEditor, ZoneEditor } from './AuditZoneEditor';

AuditEditorTab.propTypes = {
    id: PropTypes.number,
    api: PropTypes.string,
    zones: PropTypes.object,
    params: PropTypes.array
}

export function AuditEditorTab({ id, api, params }) {
    const [[functions]] = useGet(`${api}/functions`, []);
    const [[zones, setZones], loading, error] = useGet(`${api}/${id}/zones`, [id]);
    const [active, setActive] = useState({});
    const [showCriterionEditor, setShowCriterionEditor] = useState();
    const [showZoneEditor, setShowZoneEditor] = useState();
    let parameters = zones && [...new Set(zones.flatMap(z => (z.criteria || []).map(p => p.param)))].sort((a, b) => `${a}`.localeCompare(`${b}`));
    parameters = (parameters && parameters.length) ? parameters : [' '];

    const [timeout, setActiveTimeout] = useState();
    let criterionAnchor = null;
    const delayActive = (active) => {
        clearTimeout(timeout);
        setActiveTimeout(setTimeout(() => {
            setActive(active);
            setActiveTimeout();
        }, 500));
    };
    const getCriteria = (param, zone) => {
        const cr = zone.criteria && zone.criteria.filter(c => c.param === param) || [];
        return cr;
    };
    const addZone = () => {
        //const newZone = { id: 0, offset: 0, duration: 0 };
        axios.post(`${api}/${id}/zones`, {}).then((response) => {
            setZones([response.data, ...zones]);
        });
    };
    const saveZone = (data) => {
        axios.put(`${api}/zones/${data.id}`, data).then((response) => {
            const zone = zones.filter(z => z.id === response.data.id)[0];
            zone.no = response.data.no;
            zone.offset = response.data.offset;
            zone.duration = response.data.duration;
            toggleZoneEditor();
            setZones([...zones]);
        });
    };
    const deleteZone = (data) => {
        axios.delete(`${api}/zones/${data.id}`).then((response) => {
            const newZones = zones.filter(z => z.id !== response.data.id);
            toggleZoneEditor();
            setZones([...newZones]);
        });
    };
    const addCriterion = (criterion) => {
        if (criterion.id) {
            axios.put(`${api}/criteria/${criterion.id}`, criterion).then((response) => {
                const zone = zones.filter(z => z.id === response.data.zoneId)[0];
                const index = zone.criteria.findIndex(c => c.id === criterion.id);
                zone.criteria[index] = response.data;
                toggleCriterionEditor();
                setZones([...zones]);
            });
        } else {
            axios.post(`${api}/zones/${criterion.zoneId}/criteria`, { ...criterion, id: 0 }).then((response) => {
                const zone = zones.filter(z => z.id === response.data.zoneId)[0];
                zone.criteria = zone.criteria && zone.criteria.length ? [response.data, ...zone.criteria] : [response.data];
                toggleCriterionEditor();
                setZones([...zones]);
            });
        }
    };
    const deleteCriterion = (criterion) => {
        axios.delete(`${api}/criteria/${criterion.id}`, criterion).then((response) => {
            const zone = zones.filter(z => z.id === response.data.zoneId)[0];
            zone.criteria = zone.criteria.filter(c => c.id !== response.data.id);
            toggleCriterionEditor();
            setZones([...zones]);
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
        const func = functions.filter(f => f.name === c.function)[0];
        const format = func ?
            func.format.replace('{0}', c.arg1).replace('{1}', c.arg2) :
            `${c.function}(${c.arg1 || ''}, ${c.arg2 || ''})`;
        return format;
    };
    return (
        <div>
            {showCriterionEditor &&
                <CriterionEditor data={showCriterionEditor} functions={functions} params={params}
                    onClose={() => toggleCriterionEditor()}
                    onSave={addCriterion}
                    onDelete={deleteCriterion}
                />
            }
            {showZoneEditor &&
                <ZoneEditor data={showZoneEditor}
                    onClose={() => toggleZoneEditor()}
                    onSave={saveZone}
                    onDelete={deleteZone}
                />
            }
            {error && <Alert color='danger' style={{ display: 'flex', justifyContent: 'space-around' }}>{error}</Alert>}
            {loading && <Loading />}
            {!loading &&
                <Grid data={zones.sort((a, b) => a.offset - b.offset)} >
                    <GridToolbar>
                        <Button title="Add new zone" className="k-button k-secondary" onClick={addZone} >
                            <span className="k-icon k-i-add"></span>
                        </Button>
                    </GridToolbar>
                    <GridColumn title='Zone'>
                        <GridColumn field='no' title='#' width={40}
                            cell={(cellProps) =>
                                <td onClick={() => toggleZoneEditor(cellProps.dataItem)}>
                                    <a type='button'>
                                        {cellProps.dataItem[cellProps.field]}
                                    </a>
                                </td>
                            }
                        />
                        <GridColumn title='Interval'
                            cell={(cellProps) =>
                                <td onClick={() => toggleZoneEditor(cellProps.dataItem)}>
                                    <a type='button'>
                                        {`${cellProps.dataItem.offset} : ${cellProps.dataItem.offset + cellProps.dataItem.duration}`}
                                    </a>
                                </td>
                            }
                        />
                    </GridColumn>
                    <GridColumn title='Parameters' >
                        {parameters.map(p =>
                            <GridColumn key={p} field={p}
                                cell={(cellProps) =>
                                    <td style={{ position: 'relative' }}
                                        onMouseEnter={() => delayActive({ param: p, zoneId: cellProps.dataItem.id })}
                                        onMouseLeave={() => setActive({})}
                                    >
                                        {getCriteria(p, cellProps.dataItem)
                                            .map(c =>
                                                <div key={c.id}>
                                                    <a type='button' onClick={() => toggleCriterionEditor(c)}>
                                                        {funcFormat(c)}
                                                    </a>
                                                </div>
                                            )
                                        }
                                        {(active.param === p && active.zoneId === cellProps.dataItem.id) &&
                                            <div ref={(a) => { criterionAnchor = a; }}>
                                                <FloatingActionButton
                                                    positionMode='absolute'
                                                    icon='add'
                                                    size='small'
                                                    alignOffset={{ x: 10, y: 10 }}
                                                    onClick={() => toggleCriterionEditor({ zoneId: cellProps.dataItem.id, param: p })}
                                                />
                                            </div>
                                        }
                                    </td>
                                }
                            />
                        )}
                    </GridColumn>
                </Grid>
            }
        </div>
    );
}

