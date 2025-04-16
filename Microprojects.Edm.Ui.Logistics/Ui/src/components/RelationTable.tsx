import React, { Children, cloneElement, createContext, useState } from 'react';
import axios from 'axios';
import {
    Grid,
    GridColumn,
    GridToolbar,
    GridCell,
    GridRowClickEvent,
    GridItemChangeEvent
} from '@progress/kendo-react-grid';
import { Alert } from 'reactstrap';
import { ButtonGroup, Button } from '@progress/kendo-react-buttons';
import {useGet} from "../hooks/hooks"
import isEqual from 'lodash.isequal'
import {Loading} from "../features/utils/Utils";
import {ParentContext} from "./ParentContext";
import {UUID} from "@logistics/data/types";

type RelationTableProps = {
    id: UUID,
    api: string,
    editable: boolean,
    removable: boolean,
    onRowSelected: Function,
    children: React.ReactElement
}

export function RelationTable({ api, children, ...props } :RelationTableProps) {
    const [reload, setReload] = useState(false); // used to force fetching table data
    const [editItem, setEditItem] = useState<any>(null);
    let [[data, setData], loading, error] = useGet<any[]>(`${api}`, [reload, api]);

    const rowClick = (event : GridRowClickEvent | { dataItem: any }) => {
        const edit = data!.filter(i => i.inEdit)
        for (const item of edit) {
            if (!discardEdit({ dataItem: item })) {
                return
            }
        }

        const item = data!.find(i => i.id === event.dataItem.id)
        if (item) {
            setEditItem({ ...event.dataItem });
            item.inEdit = true;
            setData([...data!])
        }

        if (props.onRowSelected) {
            props.onRowSelected(event.dataItem);
        }
    };
    const itemUpdate = (item : any) => {
        setReload(r => !r)
        //// Update grid method below is faster but item and data format can be different
        // const newData = data.map(i => i.id === item.Id ? { ...item } : item)
        // setData(newData)
    }
    const itemChange = (event : GridItemChangeEvent) => {
        const newData = data!.map(item => item.inEdit ? { ...item, [event.field!]: event.value } : item);
        setData(newData);
    };
    const saveEdit = (event : { dataItem: any }) => {
        const promise = editItem.id ? axios.put(`${api}`, event.dataItem) : axios.post(`${api}`, event.dataItem);
        promise.then(() => {
            setReload(!reload);
            setEditItem(null);
        });
    };
    const addRecord = () => {
        setData([{ inEdit: true }, ...data || []]);
        setEditItem({});
    };
    const removeRecord = (event : { dataItem: any }) => {
        if (window.confirm('Confirm deleting record')) {
            const id = event.dataItem.id;
            axios.delete(`${api}/${id}`)
                .then(() => setReload(!reload));
        }
    };
    const discardEdit = (event : { dataItem: any }) => {
        const { inEdit, ...item } = event.dataItem;
        if (isEqual(editItem, item) || window.confirm('Confirm discarding changed data')) {
            //let discardedData = { ...data };
            if (isEqual(editItem, {})) {
                data = data!.filter((el) => !el.inEdit);
            } else {
                const index = data!.findIndex((el) => el.inEdit);
                data![index] = editItem;
            }

            setData(data!);
            setEditItem(null);
            return true
        }

        return false
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
                <ParentContext.Provider value={{ itemUpdate: itemUpdate }}>
                    <Grid
                        data={data}
                        editField="inEdit"
                        scrollable='none'
                        onRowClick={props.editable ? rowClick : undefined}
                        onItemChange={itemChange}
                    >
                        <GridToolbar>
                            <Button title="Add new record" className="k-button k-secondary" onClick={addRecord} disabled={editItem != null}>
                                <span className="k-icon k-i-add"></span>
                            </Button>
                        </GridToolbar>
                        {children}
                        {/* {Children.map(children, c => c?.type?.displayName === 'SubDetailColumn' ?
                        <GridColumn {...c.props} cell={(cellProps) => c.props.cell({ itemUpdate, ...cellProps })} /> : c)
                    } */}
                        <GridColumn title=''
                            width='2rem'
                            cell={(cellProps) =>
                                <ActionCell {...cellProps}
                                    edit={props.editable ? ((item) => rowClick({ dataItem: item, syntheticEvent: undefined })) : undefined}
                                    remove={props.removable ? ((item) => removeRecord({ dataItem: item })) : undefined}
                                    save={(item) => saveEdit({ dataItem: item })}
                                    discard={(item) => discardEdit({ dataItem: item })}
                                />
                            }
                        />
                    </Grid>
                </ParentContext.Provider>
            }
        </>
    );
}

type ActionCellProps = {
    edit?: (item : any) => void
    remove?: (item : any) => void
    save: (item : any) => void
    discard: (item : any) => void
    dataItem: any
}
export const ActionCell = ({ edit, remove, save, discard, ...props } : ActionCellProps) => {
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
                    onClick={() => { edit!(props.dataItem); }}
                >
                    <span className='k-icon k-i-edit'></span>
                </Button>
                <Button
                    hidden={!remove || inEdit}
                    title='Delete record'
                    style={{ padding: '6px' }}
                    fillMode='flat'
                    className="k-button k-grid-remove-command"
                    onClick={() => { remove!(props.dataItem); }}
                >
                    <span className='k-icon k-i-delete'></span>
                </Button>
            </ButtonGroup>
        </td>
    );
}

