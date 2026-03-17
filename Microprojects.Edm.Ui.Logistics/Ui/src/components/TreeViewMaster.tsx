import React, { useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, InputGroup, Input as BootInput, InputGroupText } from 'reactstrap';
import {TreeView, TreeViewDragClue, moveTreeViewItem, TreeViewDragAnalyzer } from '@progress/kendo-react-treeview';
import type { TreeViewItemClickEvent, TreeViewItemDragOverEvent, TreeViewItemDragEndEvent } from '@progress/kendo-react-treeview';
import { useGet } from '../hooks/hooks';
import { Button } from '@progress/kendo-react-buttons';
import { Card, CardBody, CardHeader } from '@progress/kendo-react-layout';
import { Loading } from "../features/utils/Utils";
import { useBasePath } from "../hooks/routerHooks";
import { ProcessKind, TreeDataItem} from "../data/types";
import axios from "axios";
import api from "../features/api/api";
import {EMPTY_GUID} from "./MasterDetail.tsx";
import {FileText, Folder2, Folder2Open, FolderPlus} from "react-bootstrap-icons";
import './TreeViewMaster.css'

export type TreeViewMasterProps = {
    api: string,
    kind?: ProcessKind,
    onCurrentRootChanged: (item : TreeDataItem) => void,
    item?: (props: TreeItemProps) => React.ReactElement,
    onRootLoaded?: (item: TreeDataItem) => void,
}

export function TreeViewMaster(props : TreeViewMasterProps) {
    const [render, setRender] = useState(0);
    _render = render;
    _renderFunc = setRender;
    const navigate = useNavigate();
    // const params = useParams<Record<string, string | undefined>>();
    // const { pathname } = useLocation();
    // const url = params && pathname.replace(`/${params['*']}`, '')
    const { path: url } = useBasePath()
    const hierarchyUrl = props.kind ? `${props.api}/hierarchy?kind=${props.kind}` : `${props.api}/hierarchy`;
    const [[data, setData], loading, error] = useGet<TreeDataItem[]>(hierarchyUrl, [render]);
    const dragClue = React.useRef<TreeViewDragClue>({} as TreeViewDragClue)
    const [filter, setFilter] = useState('');

    const visibleRoots = data && data.length === 1 && data[0].items
        ? data[0].items
        : data;

    const filteredData = visibleRoots?.filter((el) => el.name.toUpperCase().includes(filter.toUpperCase()));

    useEffect(() => {
        if (data && data.length > 0) {
            props.onRootLoaded?.(data[0]);
        }
    }, [data]);

    const onItemSelected = (e : TreeViewItemClickEvent) => {
        props.onCurrentRootChanged?.(e.item);
        navigate(`${url}${e.item.isFolder ? '/folder' : ''}/${e.item.id}`);
    };

    const getClueClassName = (event: TreeViewItemDragOverEvent) => {
        const eventAnalyzer = new TreeViewDragAnalyzer(event).init();
        const { itemHierarchicalIndex: itemIndex } = eventAnalyzer.destinationMeta;
        const targetIndexes = itemIndex?.split('_').map(i => Number.parseInt(i));
        const targetItem = targetIndexes?.reduce(
            (acc, curr) => acc.items[curr], 
            { items: data || [] } as TreeDataItem)
        
        if (eventAnalyzer.isDropAllowed && targetItem.isFolder && targetItem.id !== event.item.parentId && targetItem.id !== event.item.id) {
            return 'k-i-plus';
        }

        return "k-i-cancel";
    };

    const onItemDragOver = (event: TreeViewItemDragOverEvent) => {
        dragClue.current.show(
            event.pageY - 160,
            event.pageX,
            event.item.name,
            getClueClassName(event)
        );
    };

    const onItemDragEnd = (event: TreeViewItemDragEndEvent) => {
        dragClue.current.hide()
        const eventAnalyzer = new TreeViewDragAnalyzer(event).init()
        const { itemHierarchicalIndex: itemIndex } = eventAnalyzer.destinationMeta
        const targetIndexes = itemIndex.split('_').map(i => Number.parseInt(i))
        const targetItem = targetIndexes.reduce(
            (acc, curr) => acc.items[curr], 
            { items: data || [] } as TreeDataItem)

        if (eventAnalyzer.isDropAllowed && targetItem.isFolder && targetItem.id !== event.item.parentId && targetItem.id !== event.item.id) {
            const updatedTree = moveTreeViewItem(
                event.itemHierarchicalIndex,
                data,
                eventAnalyzer.getDropOperation() || 'after',
                eventAnalyzer.destinationMeta.itemHierarchicalIndex
            ) as TreeDataItem[]
            event.item.parentId = targetItem.id
            const link = event.item.isFolder ? api.directories : props.api
            axios.put(`${link}/${event.item.id}/parent`, targetItem)
            setData(updatedTree)
        }
    }

    return (
        <>
            <Card style={{ backgroundColor: 'rgba(248,249,250,1)' }}>
                <CardHeader style={{ display: 'inline-flex', alignItems: 'center', width: '100%', paddingLeft: '10px' }}>
                    <InputGroup>
                        <InputGroupText>
                            <span className='k-icon k-i-search' style={{ alignSelf: 'center' }} />
                        </InputGroupText>
                        <BootInput
                            bsSize='sm'
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </InputGroup>
                    <Button fillMode='flat' title='Add new folder' style={{ justifySelf: 'end' }}
                        onClick={() => navigate(`${url}/folder/${EMPTY_GUID}`)}
                    >
                        {/*<span className="k-icon k-i-folder-add" />*/}
                        <FolderPlus/>
                    </Button>
                    <Button fillMode='flat' title='Add new item' style={{ justifySelf: 'end' }}
                        onClick={() => navigate(`${url}/${EMPTY_GUID}`)}
                    >
                        <span className="k-icon k-i-file-add" />
                    </Button>
                </CardHeader>
                <CardBody>
                    {error ?
                        <Alert color='danger' style={{ display: 'flex', justifyContent: 'space-around' }}>{error}</Alert> :
                        loading ?
                            <Loading /> :
                            <div className="disable-select">
                                <TreeView
                                    item={props.item || TreeItem}
                                    //focusIdField='id'
                                    //item={(el) => (<span key={el.item.id} className={el.item.items ? "font-weight-bolder" : ""}>{el.item.name}</span>)}
                                    textField='name'
                                    expandIcons={true}
                                    data={filteredData}
                                    onItemClick={onItemSelected}
                                    onExpandChange={(e) => {
                                        e.item.expanded = !e.item.expanded;
                                    }}
                                    draggable={true}
                                    onItemDragOver={onItemDragOver}
                                    onItemDragEnd={onItemDragEnd}
                                />
                                <TreeViewDragClue ref={dragClue} />
                            </div>
                    }
                </CardBody>
            </Card>
        </>
    );
}

export type TreeItemProps = {
    item: TreeDataItem
}

const TreeItem = (props : TreeItemProps) => {
    return (
        <>
            {/*<span className={iconClassName(props.item)}>&nbsp;</span>*/}
            {icon(props.item)}&nbsp;
            <span className={props.item.isFolder ? 'fw-bolder' : ''} title={props.item.description}>
                {props.item.name}
            </span>
        </>
    );
};

function iconClassName({ isFolder, isActive, ...item } : TreeDataItem) {
    if (isFolder) {
        return item.expanded ? "k-icon k-i-folder-open" : "k-icon k-i-folder";
    }

    return "k-icon k-i-file-txt";
}

function icon({ isFolder, isActive, ...item } : TreeDataItem) {
    if (isFolder) {
        return item.expanded ? <Folder2Open /> : <Folder2/>;
    }

    return <FileText/>;
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

let _render : number;
let _renderFunc : (i: number) => void;

export function refresh() {
    _renderFunc(++_render);
}
