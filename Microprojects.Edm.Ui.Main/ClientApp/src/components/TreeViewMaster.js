import React, { useState } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Alert, InputGroup, Input as BootInput, InputGroupText } from 'reactstrap';
import { TreeView, TreeViewDragClue, moveTreeViewItem, TreeViewDragAnalyzer } from '@progress/kendo-react-treeview';
import { useGet } from './hooks/hooks';
import { Loading } from './utils/Utils';
import { Button } from '@progress/kendo-react-buttons';
import { Card, CardBody, CardHeader } from '@progress/kendo-react-layout';
import axios from 'axios';
import api from './api';

TreeViewMaster.propTypes = {
    api: PropTypes.string,
    onCurrentRootChanged: PropTypes.func,
    item: PropTypes.func
}

const StyledTreeView = styled(TreeView)`
    overflow-x: hidden;
`

export function TreeViewMaster(props) {
    const [render, setRender] = useState(0);
    _render = render;
    _renderFunc = setRender;
    const history = useHistory();
    const { url } = useRouteMatch();
    const [[data, setData], loading, error] = useGet(`${props.api}/hierarchy`, [render]);
    const dragClue = React.useRef();
    const [filter, setFilter] = useState('');
    const filteredData = data && data.filter((el) => el.name.toUpperCase().includes(filter.toUpperCase()));

    const onItemSelected = (e) => {
        props.onCurrentRootChanged && props.onCurrentRootChanged(e.item);
        if (e.item.isNode) {
            history.push(`${url}/folder/${e.item.id}`);
        } else {
            history.push(`${url}/${e.item.id}`);
        }
    };

    const getClueClassName = (event) => {
        const eventAnalyzer = new TreeViewDragAnalyzer(event).init();
        const { itemHierarchicalIndex: itemIndex } = eventAnalyzer.destinationMeta;
        const targetIndexes = itemIndex && itemIndex.split('_').map(i => parseInt(i));
        const targetItem = targetIndexes && targetIndexes.reduce((acc, curr) => acc.items[curr], { items: data });

        if (eventAnalyzer.isDropAllowed && targetItem.isNode && targetItem.id !== event.item.parentId && targetItem.id !== event.item.id) {
            return 'k-i-plus';
        }

        return "k-i-cancel";
    };

    const onItemDragOver = (event) => {
        dragClue.current.show(
            event.pageY - 150,
            event.pageX,
            event.item.name,
            getClueClassName(event)
        );
    };

    const onItemDragEnd = (event) => {
        dragClue.current.hide();
        const eventAnalyzer = new TreeViewDragAnalyzer(event).init();
        const { itemHierarchicalIndex: itemIndex } = eventAnalyzer.destinationMeta;
        const targetIndexes = itemIndex && itemIndex.split('_').map(i => parseInt(i));
        const targetItem = targetIndexes && targetIndexes.reduce((acc, curr) => acc.items[curr], { items: data });

        if (eventAnalyzer.isDropAllowed && targetItem.isNode && targetItem.id !== event.item.parentId && targetItem.id !== event.item.id) {
            const updatedTree = moveTreeViewItem(
                event.itemHierarchicalIndex,
                data,
                eventAnalyzer.getDropOperation(),
                eventAnalyzer.destinationMeta.itemHierarchicalIndex
            );
            event.item.parentId = targetItem.id;
            const link = event.item.isNode ? api.hierarchies : props.api;
            axios.put(`${link}/${event.item.id}/parent`, targetItem);
            setData(updatedTree);
        }
    };

    return (
        <>
            <Card style={{ backgroundColor: 'rgba(248,249,250,1)' }}>
                <CardHeader style={{ display: 'inline-flex', alignItems: 'center', width: '100%', paddingLeft: '10px' }}>
                    <InputGroup>
                        <InputGroupText>
                            <span className='k-icon k-i-search' style={{ alignSelf: 'center' }}></span>
                        </InputGroupText>
                        <BootInput
                            bsSize='sm'
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </InputGroup>
                    <Button fillMode='flat' title='Add new folder'
                        onClick={() => history.push(`${url}/folder/0`)} style={{ justifySelf: 'end' }}
                    >
                        <span className="k-icon k-i-folder-add"></span>
                    </Button>
                    <Button fillMode='flat' title='Add new item'
                        onClick={() => history.push(`${url}/0`)} style={{ justifySelf: 'end' }}
                    >
                        <span className="k-icon k-i-file-add"></span>
                    </Button>
                </CardHeader>
                <CardBody className='disable-select'>
                    {error ?
                        <Alert color='danger' style={{ display: 'flex', justifyContent: 'space-around' }}>{error}</Alert> :
                        loading ?
                            <Loading /> :
                            <>
                                <StyledTreeView
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
                            </>
                    }
                </CardBody>
            </Card>
        </>
    );
}

const TreeItem = (props) => {
    return (
        <>
            <span className={iconClassName(props.item)}>&nbsp;</span>
            <span className={props.item.isNode ? 'fw-bolder' : ''}>{props.item.name}</span>
        </>
    );
};

function iconClassName({ isNode, isActive, ...item }) {
    if (isNode) {
        return item.expanded ? "k-icon k-i-folder-open" : "k-icon k-i-folder";
    } else {
        return "k-icon k-i-file-txt";
    }
}

function getSiblings(itemIndex, data) {
    let result = data;
    const indices = itemIndex.split('_').map((index) => Number(index));

    for (let i = 0; i < indices.length - 1; i++) {
        result = result[indices[i]].items;
    }

    return result;
}

let _render, _renderFunc;

export function refresh() {
    _renderFunc(++_render);
}
