import { Button } from '@progress/kendo-react-buttons'
import { Card, CardBody, CardHeader } from '@progress/kendo-react-layout'
import { TreeView } from '@progress/kendo-react-treeview'
import type { TreeViewItemClickEvent } from '@progress/kendo-react-treeview'
import axios from 'axios'
import type React from 'react'
import { useEffect, useState } from 'react'
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
import { useGet } from '../hooks/hooks'
import { useBasePath } from '../hooks/routerHooks'

export type TreeViewLinkProps = {
    api: string
    onCurrentRootChanged: (item: TreeDataItem) => void
    item?: (props: TreeItemProps) => React.ReactElement
}

export function TreeViewLink(props: TreeViewLinkProps) {
    const navigate = useNavigate()
    const { path: url } = useBasePath()
    const [[data, setData], loading, error] = useGet<TreeDataItem[]>(
        `${props.api}/hierarchy`,
        [props.api],
    )
    const [filter, setFilter] = useState('')
    const filteredData = data?.filter((el) =>
        el.name.toUpperCase().includes(filter.toUpperCase()),
    )

    const onItemSelected = (e: TreeViewItemClickEvent) => {
        !e.item.isFolder && props.onCurrentRootChanged?.(e.item)
    }

    return (
        <div>
            <div
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    width: '80%',
                    marginBottom: '20px',
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
            </div>
            <div>
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
                            textField="name"
                            expandIcons={true}
                            data={filteredData}
                            onItemClick={onItemSelected}
                            onExpandChange={(e) => {
                                e.item.expanded = !e.item.expanded
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}

export type TreeItemProps = {
    item: TreeDataItem
}

const TreeItem = (props: TreeItemProps) => {
    return (
        <>
            {/*<span className={iconClassName(props.item)}>&nbsp;</span>*/}
            {icon(props.item)}&nbsp;
            <span
                className={props.item.isFolder ? 'fw-bolder' : ''}
                title={props.item.description}
            >
                {props.item.name}
            </span>
        </>
    )
}

function icon({ isFolder, isActive, ...item }: TreeDataItem) {
    if (isFolder) {
        return item.expanded ? <Folder2Open /> : <Folder2 />
    }

    return <FileText />
}
