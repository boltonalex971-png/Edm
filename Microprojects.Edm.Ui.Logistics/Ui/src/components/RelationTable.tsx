import type { UUID } from '@logistics/data/types'
import { Button, ButtonGroup } from '@progress/kendo-react-buttons'
import {
    Grid,
    GridCell,
    type GridCellProps,
    GridColumn,
    type GridItemChangeEvent,
    type GridRowClickEvent,
    type GridRowDoubleClickEvent,
    GridToolbar,
} from '@progress/kendo-react-grid'
import axios from 'axios'
import isEqual from 'lodash.isequal'
import type React from 'react'
import { useMemo, useState } from 'react'
import { Alert } from 'reactstrap'
import { Loading } from '../features/utils/Utils'
import {
    type EntityTag,
    useEntityToken,
    useInvalidateEntities,
} from '../hooks/entityRefresh'
import { useGet } from '../hooks/hooks'
import { formatLocalDate, formatLocalDateTime } from '../utils/format'
import { ParentContext } from './ParentContext'

export type RelationTableAddMode = 'inline' | 'subdetail'

type RelationTableProps = {
    id?: UUID
    api: string
    editable: boolean
    removable: boolean
    creatable?: boolean
    addMode?: RelationTableAddMode
    createSubDetail?: (args: {
        api: string
        onClose: () => void
        onCreated: (created: any) => void
    }) => React.ReactElement
    subDetail?: (args: {
        mode: 'create' | 'edit'
        api: string
        dataItem?: any
        onClose: () => void
        onSaved: (saved: any) => void
    }) => React.ReactElement
    onRowSelected?: Function
    onRowClick?: (event: GridRowClickEvent) => void
    onRowDoubleClick?: (event: GridRowDoubleClickEvent) => void
    // Tags published on every save/delete and subscribed to for refetches.
    // Always augmented with a per-URL tag so a table self-refreshes after its
    // own mutations even when the caller forgets to pass tags.
    invalidateTags?: EntityTag[]
    children: React.ReactElement
}

export function RelationTable({ api, children, ...props }: RelationTableProps) {
    const tags = useMemo<EntityTag[]>(
        () => [
            ...(props.invalidateTags ?? []),
            { type: `relation:${api}` },
        ],
        [props.invalidateTags, api],
    )
    const token = useEntityToken(tags)
    const invalidate = useInvalidateEntities()
    const [editItem, setEditItem] = useState<any>(null)
    const [subDetail, setSubDetail] = useState<React.ReactElement>()
    let [[data, setData], loading, error] = useGet<any[]>(`${api}`, [api, token])

    const rowClick = (event: GridRowClickEvent | { dataItem: any }) => {
        if (props.onRowSelected) {
            props.onRowSelected(event.dataItem, itemUpdate)
        }
    }
    const enterEdit = (event: GridRowClickEvent | { dataItem: any }) => {
        const edit = data!.filter((i) => i.inEdit)
        for (const item of edit) {
            if (!discardEdit({ dataItem: item })) {
                return
            }
        }

        const item = data!.find((i) => i.id === event.dataItem.id)
        if (item) {
            setEditItem({ ...event.dataItem })
            item.inEdit = true
            setData([...data!])
        }
    }
    const itemUpdate = (item: any) => {
        invalidate(tags)
        //// Update grid method below is faster but item and data format can be different
        // const newData = data.map(i => i.id === item.Id ? { ...item } : item)
        // setData(newData)
    }
    const itemChange = (event: GridItemChangeEvent) => {
        const newData = data!.map((item) =>
            item.inEdit ? { ...item, [event.field!]: event.value } : item,
        )
        setData(newData)
    }
    const saveEdit = (event: { dataItem: any }) => {
        const promise = editItem.id
            ? axios.put(`${api}`, event.dataItem)
            : axios.post(`${api}`, event.dataItem)
        promise.then(() => {
            invalidate(tags)
            setEditItem(null)
        })
    }

    const openSubDetail = (mode: 'create' | 'edit', dataItem?: any) => {
        const factory = props.subDetail
        if (factory) {
            setSubDetail(
                factory({
                    mode,
                    api,
                    dataItem,
                    onClose: () => setSubDetail(undefined),
                    onSaved: (saved) => {
                        itemUpdate(saved)
                        setSubDetail(undefined)
                    },
                }),
            )
            return true
        }

        if (mode === 'create' && props.createSubDetail) {
            setSubDetail(
                props.createSubDetail({
                    api,
                    onClose: () => setSubDetail(undefined),
                    onCreated: (created) => {
                        itemUpdate(created)
                        setSubDetail(undefined)
                    },
                }),
            )
            return true
        }

        return false
    }

    const addRecord = () => {
        if ((props.addMode || 'inline') === 'subdetail') {
            if (!openSubDetail('create')) {
                throw new Error(
                    'RelationTable addMode=subdetail requires subDetail or createSubDetail',
                )
            }
            return
        }

        setData([{ inEdit: true }, ...(data || [])])
        setEditItem({})
    }
    const removeRecord = (event: { dataItem: any }) => {
        if (window.confirm('Confirm deleting record')) {
            const id = event.dataItem.id
            axios.delete(`${api}/${id}`).then(() => invalidate(tags))
        }
    }
    const discardEdit = (event: { dataItem: any }) => {
        const { inEdit, ...item } = event.dataItem
        if (
            isEqual(editItem, item) ||
            window.confirm('Confirm discarding changed data')
        ) {
            //let discardedData = { ...data };
            if (isEqual(editItem, {})) {
                data = data!.filter((el) => !el.inEdit)
            } else {
                const index = data!.findIndex((el) => el.inEdit)
                data![index] = editItem
            }

            setData(data!)
            setEditItem(null)
            return true
        }

        return false
    }
    const linkItem = (item: any, itemUpdate: (item: any) => void) => {}

    return (
        <>
            <style>
                {`
                    /* Scoped to grid-internal popups only — a global rule here
                       would make every Kendo popup (tooltip, datepicker, combobox)
                       stretch to full viewport width. */
                    .k-grid .k-animation-container-relative {
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
            {error && (
                <Alert
                    color="danger"
                    style={{ display: 'flex', justifyContent: 'space-around' }}
                >
                    {error}
                </Alert>
            )}
            {loading && <Loading />}
            {data && (
                <ParentContext.Provider value={{ itemUpdate: itemUpdate }}>
                    <>
                        <Grid
                            data={data}
                            editField="inEdit"
                            scrollable="none"
                            onRowClick={rowClick}
                            onRowDoubleClick={props.onRowDoubleClick}
                            onItemChange={itemChange}
                        >
                            {props.creatable && (
                                <GridToolbar>
                                    <Button
                                        title="Add new record"
                                        className="k-button k-secondary"
                                        onClick={addRecord}
                                        disabled={editItem != null}
                                    >
                                        <span className="k-icon k-i-add"></span>
                                    </Button>
                                </GridToolbar>
                            )}
                            {children}
                            <GridColumn
                                title=""
                                width="2rem"
                                cell={(cellProps) => (
                                    <ActionCell
                                        {...cellProps}
                                        edit={
                                            props.editable
                                                ? (item) => {
                                                      if (
                                                          (props.addMode ||
                                                              'inline') ===
                                                          'subdetail'
                                                      ) {
                                                          if (
                                                              !openSubDetail(
                                                                  'edit',
                                                                  item,
                                                              )
                                                          ) {
                                                              // Fallback to inline edit if no factory provided.
                                                              enterEdit({
                                                                  dataItem:
                                                                      item,
                                                                  syntheticEvent:
                                                                      undefined,
                                                              })
                                                          }
                                                      } else {
                                                          enterEdit({
                                                              dataItem: item,
                                                              syntheticEvent:
                                                                  undefined,
                                                          })
                                                      }
                                                  }
                                                : undefined
                                        }
                                        remove={
                                            props.removable
                                                ? (item) =>
                                                      removeRecord({
                                                          dataItem: item,
                                                      })
                                                : undefined
                                        }
                                        save={(item) =>
                                            saveEdit({ dataItem: item })
                                        }
                                        discard={(item) =>
                                            discardEdit({ dataItem: item })
                                        }
                                    />
                                )}
                            />
                        </Grid>
                        <div className="mt-2" />
                        {subDetail}
                    </>
                </ParentContext.Provider>
            )}
        </>
    )
}

type ActionCellProps = {
    edit?: (item: any) => void
    remove?: (item: any) => void
    save: (item: any) => void
    discard: (item: any) => void
    link?: (item: any) => void
    dataItem: any
}
export const ActionCell = ({
    edit,
    remove,
    save,
    link,
    discard,
    ...props
}: ActionCellProps) => {
    const inEdit = props.dataItem.inEdit
    return (
        <td>
            <ButtonGroup>
                <Button
                    hidden={!inEdit}
                    title="Save record"
                    style={{ padding: '6px' }}
                    fillMode="flat"
                    className="k-button k-grid-save-command"
                    onClick={() => {
                        save(props.dataItem)
                    }}
                >
                    <span className="k-icon k-i-save"></span>
                </Button>
                <Button
                    hidden={!inEdit}
                    title="Discard changes"
                    style={{ padding: '6px' }}
                    fillMode="flat"
                    className="k-button k-grid-close-command"
                    onClick={() => {
                        discard(props.dataItem)
                    }}
                >
                    <span className="k-icon k-i-close"></span>
                </Button>
                <Button
                    hidden={!edit || inEdit}
                    title="Edit record"
                    style={{ padding: '6px' }}
                    fillMode="flat"
                    className="k-button k-grid-edit-command"
                    onClick={() => {
                        edit!(props.dataItem)
                    }}
                >
                    <span className="k-icon k-i-edit"></span>
                </Button>
                <Button
                    hidden={!link || inEdit}
                    title="Choose entity"
                    style={{ padding: '6px' }}
                    fillMode="flat"
                    className="k-button k-grid-edit-command"
                    onClick={() => {
                        link!(props.dataItem)
                    }}
                >
                    <span className="k-icon k-i-plus"></span>
                </Button>
                <Button
                    hidden={!remove || inEdit}
                    title="Delete record"
                    style={{ padding: '6px' }}
                    fillMode="flat"
                    className="k-button k-grid-remove-command"
                    onClick={() => {
                        remove!(props.dataItem)
                    }}
                >
                    <span className="k-icon k-i-delete"></span>
                </Button>
            </ButtonGroup>
        </td>
    )
}

export const DateCell = (props: GridCellProps) => {
    const value = props.dataItem[props.field!]
    return <td>{formatLocalDate(value)}</td>
}

export const DateTimeCell = (props: GridCellProps) => {
    const value = props.dataItem[props.field!]
    return <td>{formatLocalDateTime(value)}</td>
}
