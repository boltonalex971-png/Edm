import React, { useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { isEqual } from 'lodash';
import { Grid, GridColumn, GridToolbar, GridCell } from '@progress/kendo-react-grid';
import { useGet } from './hooks/hooks';
import { Loading } from './utils/Utils';
import { Alert } from 'reactstrap';
import { ButtonGroup, Button } from '@progress/kendo-react-buttons';

RelationTable.propTypes = {
    id: PropTypes.number,
    api: PropTypes.string,
    columns: PropTypes.node,
    editable: PropTypes.bool,
    removable: PropTypes.bool,
    onRowSelected: PropTypes.func,
    children: PropTypes.node
}

export function RelationTable({ api, children, ...props }) {
    const [reload, setReload] = useState(false); // used to force fetching table data
    const [editItem, setEditItem] = useState(null);
    const [[data, setData], loading, error] = useGet(`${api}`, [reload]);
    const rowClick = (event) => {
        // eslint-disable-next-line no-unused-vars
        const { inEdit, ...item } = event.dataItem;
        if (props.editable) {
            setEditItem(item);
        }

        if (props.onRowSelected) {
            props.onRowSelected(item);
        }
    };
    const itemChange = (event) => {
        const inEditID = event.dataItem.id;
        const newData = data.map(item =>
            item.id === inEditID ? { ...item, [event.field]: event.value } : item
        );
        setData(newData);
    };
    const saveEdit = (event) => {
        console.log(event);
        const promise = event.dataItem.id === 0 ? axios.post(`${api}`, event.dataItem) : axios.put(`${api}`, event.dataItem);
        // Force fetch
        // TODO think about inserting row in data w/o fetching data
        promise.then(() => {
            setReload(!reload);
            setEditItem(null);
        });
    };
    const addRecord = () => {
        const newId = 0;
        const newRecord = { id: newId };
        setData([newRecord, ...data]);
        setEditItem(newRecord);
    };
    const removeRecord = (event) => {
        if (window.confirm('Confirm deleting record')) {
            const id = event.dataItem.id;
            axios.delete(`${api}/${id}`)
                .then(() => setReload(!reload));
        }
    };
    const discardEdit = (event) => {
        // eslint-disable-next-line no-unused-vars
        const { inEdit, ...item } = event.dataItem;
        if (isEqual(editItem, item) || window.confirm('Confirm discarding changed data')) {
            let discardedData = data;
            if (editItem.id === 0) {
                discardedData = data.filter((el) => el.id != 0);
            } else {
                const index = data.findIndex((el) => el.id === editItem.id);
                data[index] = editItem;
            }
            setData(discardedData);
            setEditItem(null);
        }
    };

    return (
        <>
            <style>
                {`
                    /* TODO Fix for Kendo Grid width in container */
                    .k-animation-container-relative {
                        width: 100%;
                    }
                    .k-grid td {
                        padding: 0.5rem 0.5rem;
                    }
                    .k-grid td button {
                        padding: 0;
                    }
                `}
            </style>
            {error && <Alert color='danger' style={{ display: 'flex', justifyContent: 'space-around' }}>{error}</Alert>}
            {loading && <Loading />}
            {data &&
                <Grid
                    data={data.map((item) => ({ ...item, inEdit: editItem && item.id === editItem.id }))}
                    editField="inEdit"
                    scrollable='none'
                    onRowClick={rowClick}
                    onItemChange={itemChange}
                >
                    <GridToolbar>
                        <Button title="Add new record" className="k-button k-secondary" onClick={addRecord} disabled={editItem != null}>
                            <span className="k-icon k-i-add"></span>
                        </Button>
                    </GridToolbar>
                    {children}
                    <GridColumn title=''
                        cell={(cellProps) =>
                            <ActionCell {...cellProps}
                                edit={props.editable && ((item) => rowClick({ dataItem: item }))}
                                remove={props.removable && ((item) => removeRecord({ dataItem: item }))}
                                save={(item) => saveEdit({ dataItem: item })}
                                discard={(item) => discardEdit({ dataItem: item })}
                            />
                        }
                    />
                </Grid>
            }
        </>
    );
}
export const ActionCell = ({ edit, remove, save, discard, ...props }) => {
    const inEdit = props.dataItem.inEdit;
    return (
        <td>
            <ButtonGroup>
                <Button
                    hidden={!inEdit}
                    title='Save record'
                    style={{ padding: '6px' }}
                    fillMode='flat'
                    className='k-button k-grid-save-command'
                    onClick={() => { save(props.dataItem); }}
                >
                    <span className='k-icon k-i-save'></span>
                </Button>
                <Button
                    hidden={!inEdit}
                    title='Discard changes'
                    style={{ padding: '6px' }}
                    fillMode='flat'
                    className="k-button k-grid-close-command"
                    onClick={() => { discard(props.dataItem); }}
                >
                    <span className='k-icon k-i-close'></span>
                </Button>
                <Button
                    hidden={!edit || inEdit}
                    title='Edit record'
                    style={{ padding: '6px' }}
                    fillMode='flat'
                    className='k-button k-grid-edit-command'
                    onClick={() => { edit(props.dataItem); }}
                >
                    <span className='k-icon k-i-edit'></span>
                </Button>
                <Button
                    hidden={!remove || inEdit}
                    title='Delete record'
                    style={{ padding: '6px' }}
                    fillMode='flat'
                    className="k-button k-grid-remove-command"
                    onClick={() => { remove(props.dataItem); }}
                >
                    <span className='k-icon k-i-delete'></span>
                </Button>
            </ButtonGroup>
        </td>
    );
}

ActionCell.propTypes = {
    edit: PropTypes.func,
    remove: PropTypes.func,
    save: PropTypes.func,
    discard: PropTypes.func,
    inEdit: PropTypes.string,
    dataItem: PropTypes.object
};