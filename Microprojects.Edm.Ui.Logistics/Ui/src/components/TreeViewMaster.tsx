import { Button } from '@progress/kendo-react-buttons'
import { Card, CardBody, CardHeader } from '@progress/kendo-react-layout'
import {
    TreeView,
    TreeViewDragAnalyzer,
    TreeViewDragClue,
    moveTreeViewItem,
} from '@progress/kendo-react-treeview'
import type {
    TreeViewItemClickEvent,
    TreeViewItemDragEndEvent,
    TreeViewItemDragOverEvent,
} from '@progress/kendo-react-treeview'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import {
    FileText,
    Folder2,
    Folder2Open,
    FolderPlus,
} from 'react-bootstrap-icons'
import { useNavigate } from 'react-router-dom'
import {
    Alert,
    Input as BootInput,
    InputGroup,
    InputGroupText,
} from 'reactstrap'
import type { TreeDataItem } from '../data/types'
import api from '../features/api/api'
import { Loading } from '../features/utils/Utils'
import { useInvalidateEntities } from '../hooks/entityRefresh'
import { useGet } from '../hooks/hooks'
import { useBasePath } from '../hooks/routerHooks'
import { EMPTY_GUID } from './MasterDetail.tsx'
import './TreeViewMaster.css'

type QueryParams = Record<string, string | undefined>

export type TreeViewMasterProps = {
    api: string
    getHierarchyQuery?: () => QueryParams
    onCurrentRootChanged?: (item: TreeDataItem) => void
    item?: (props: TreeItemProps) => React.ReactElement
    onRootLoaded?: (item: TreeDataItem) => void
    refreshToken?: unknown
    publishType?: string
}

function buildUrl(base: string, query: QueryParams) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
        if (value != null && value !== '') {
            params.set(key, value)
        }
    }

    const qs = params.toString()
    return qs ? `${base}?${qs}` : base
}

export function TreeViewMaster(props: TreeViewMasterProps) {
    const navigate = useNavigate()
    const invalidate = useInvalidateEntities()
    const { path: url } = useBasePath()
    const hierarchyUrl = buildUrl(
        `${props.api}/hierarchy`,
        props.getHierarchyQuery?.() || {},
    )
    const [[data, setData], loading, error] = useGet<TreeDataItem[]>(
        hierarchyUrl,
        [props.refreshToken],
    )
    const dragClue = React.useRef<TreeViewDragClue>({} as TreeViewDragClue)
    const [filter, setFilter] = useState('')
    const [selectedItem, setSelectedItem] = useState<TreeDataItem>()
    const [rootItem, setRootItem] = useState<TreeDataItem>()

    const visibleRoots =
        data && data.length === 1 && data[0].items ? data[0].items : data

    const filteredData = visibleRoots?.filter((el) =>
        el.name.toUpperCase().includes(filter.toUpperCase()),
    )

    useEffect(() => {
        if (data && data.length > 0) {
            setRootItem(data[0])
            props.onRootLoaded?.(data[0])
        }
    }, [data])

    const onItemSelected = (e: TreeViewItemClickEvent) => {
        setSelectedItem(e.item)
        props.onCurrentRootChanged?.(e.item)
        navigate(`${url}${e.item.isFolder ? '/folder' : ''}/${e.item.id}`)
    }

    const addNewItem = () => {
        const parentId = selectedItem?.isFolder
            ? selectedItem.id
            : selectedItem?.directoryId || rootItem?.id

        navigate(`${url}/${EMPTY_GUID}`, { state: { parentId } })
    }

    // Drag indices are positions in the rendered tree (filteredData), not in `data`,
    // because data may wrap a hidden common root whose children are what's actually shown.
    const resolveTargetItem = (itemIndex: string | undefined) => {
        if (!itemIndex) return undefined
        return itemIndex
            .split('_')
            .map((i) => Number.parseInt(i))
            .reduce<TreeDataItem | undefined>(
                (acc, curr) => acc?.items?.[curr],
                { items: filteredData ?? [] } as TreeDataItem,
            )
    }

    const getClueClassName = (event: TreeViewItemDragOverEvent) => {
        const eventAnalyzer = new TreeViewDragAnalyzer(event).init()
        const targetItem = resolveTargetItem(
            eventAnalyzer.destinationMeta.itemHierarchicalIndex,
        )

        if (
            targetItem?.isFolder &&
            eventAnalyzer.isDropAllowed &&
            targetItem.id !== event.item.parentId &&
            targetItem.id !== event.item.id
        ) {
            return 'k-i-plus'
        }

        return 'k-i-cancel'
    }

    const onItemDragOver = (event: TreeViewItemDragOverEvent) => {
        dragClue.current.show(
            event.pageY - 160,
            event.pageX,
            event.item.name,
            getClueClassName(event),
        )
    }

    const onItemDragEnd = (event: TreeViewItemDragEndEvent) => {
        dragClue.current.hide()
        const eventAnalyzer = new TreeViewDragAnalyzer(event).init()
        const targetItem = resolveTargetItem(
            eventAnalyzer.destinationMeta.itemHierarchicalIndex,
        )

        if (
            targetItem?.isFolder &&
            eventAnalyzer.isDropAllowed &&
            targetItem.id !== event.item.parentId &&
            targetItem.id !== event.item.id
        ) {
            const updatedSubtree = moveTreeViewItem(
                event.itemHierarchicalIndex,
                filteredData ?? [],
                eventAnalyzer.getDropOperation() || 'after',
                eventAnalyzer.destinationMeta.itemHierarchicalIndex,
            ) as TreeDataItem[]
            event.item.parentId = targetItem.id
            const link = event.item.isFolder ? api.directories : props.api
            axios.put(`${link}/${event.item.id}/parent`, targetItem).then(() => {
                if (props.publishType) {
                    invalidate([
                        { type: props.publishType },
                        { type: props.publishType, id: event.item.id },
                    ])
                }
            })
            // Restore the hidden-root wrapper so the next render still hides it.
            const hadHiddenRoot =
                data && data.length === 1 && data[0].items !== undefined
            setData(
                hadHiddenRoot
                    ? [{ ...data![0], items: updatedSubtree }]
                    : updatedSubtree,
            )
        }
    }

    return (
        <>
            <Card style={{ backgroundColor: 'rgba(248,249,250,1)' }}>
                <CardHeader
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        width: '100%',
                        paddingLeft: '10px',
                    }}
                >
                    <InputGroup>
                        <InputGroupText>
                            <span
                                className="k-icon k-i-search"
                                style={{ alignSelf: 'center' }}
                            />
                        </InputGroupText>
                        <BootInput
                            bsSize="sm"
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </InputGroup>
                    <Button
                        fillMode="flat"
                        title="Add new folder"
                        style={{ justifySelf: 'end' }}
                        onClick={() => navigate(`${url}/folder/${EMPTY_GUID}`)}
                    >
                        {/*<span className="k-icon k-i-folder-add" />*/}
                        <FolderPlus />
                    </Button>
                    <Button
                        fillMode="flat"
                        title="Add new item"
                        style={{ justifySelf: 'end' }}
                        onClick={addNewItem}
                    >
                        <span className="k-icon k-i-file-add" />
                    </Button>
                </CardHeader>
                <CardBody>
                    {error ? (
                        <Alert
                            color="danger"
                            style={{
                                display: 'flex',
                                justifyContent: 'space-around',
                            }}
                        >
                            {error}
                        </Alert>
                    ) : loading ? (
                        <Loading />
                    ) : (
                        <div className="disable-select">
                            <TreeView
                                item={props.item || TreeItem}
                                //focusIdField='id'
                                //item={(el) => (<span key={el.item.id} className={el.item.items ? "font-weight-bolder" : ""}>{el.item.name}</span>)}
                                textField="name"
                                expandIcons={true}
                                data={filteredData}
                                onItemClick={onItemSelected}
                                onExpandChange={(e) => {
                                    e.item.expanded = !e.item.expanded
                                }}
                                draggable={true}
                                onItemDragOver={onItemDragOver}
                                onItemDragEnd={onItemDragEnd}
                            />
                            <TreeViewDragClue ref={dragClue} />
                        </div>
                    )}
                </CardBody>
            </Card>
        </>
    )
}

export type TreeItemProps = {
    item: TreeDataItem
}

const TreeItem = (props: TreeItemProps) => {
    const tooltip =
        props.item.description && props.item.description !== props.item.name
            ? `${props.item.name} — ${props.item.description}`
            : props.item.name
    return (
        <>
            {/*<span className={iconClassName(props.item)}>&nbsp;</span>*/}
            {icon(props.item)}&nbsp;
            <span
                className={props.item.isFolder ? 'fw-bolder' : ''}
                title={tooltip}
            >
                {props.item.name}
            </span>
        </>
    )
}

function iconClassName({ isFolder, isActive, ...item }: TreeDataItem) {
    if (isFolder) {
        return item.expanded ? 'k-icon k-i-folder-open' : 'k-icon k-i-folder'
    }

    return 'k-icon k-i-file-txt'
}

function icon({ isFolder, isActive, ...item }: TreeDataItem) {
    if (isFolder) {
        return item.expanded ? <Folder2Open /> : <Folder2 />
    }

    return <FileText />
}

// function getSiblings(itemIndex, data) {
//     let result = data;
//     const indices = itemIndex.split('_').map((index) => Number(index));
//
//     for (let i = 0; i < indices.length - 1; i++) {
//         result = result[indices[i]].items;
//     }
//
//     return result;
// }
