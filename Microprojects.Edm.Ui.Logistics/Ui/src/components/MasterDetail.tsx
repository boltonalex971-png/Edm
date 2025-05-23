import type React from "react";
import {type MouseEventHandler, useState} from "react"
import {Route, Routes, useNavigate} from "react-router-dom";
import axios from 'axios';
import { Card, CardHeader, CardBody, CardTitle, CardSubtitle } from '@progress/kendo-react-layout';
import { Form, FormElement } from '@progress/kendo-react-form';
import {Button, ButtonGroup, type ButtonProps, Toolbar, ToolbarItem} from '@progress/kendo-react-buttons';
import { Alert } from 'reactstrap';
import { SmartScroll, SmartScrollContent } from "./SmartScroll";
import { TreeViewMaster, refresh } from "./TreeViewMaster";
import { Loading, DetailStub } from "../features/utils/Utils";
import api from '../features/api/api';
import { Folder } from "./config/Folder";
import { useBasePath } from "../hooks/routerHooks";
import type {DataItem, DetailEventHandler, Dictionary, TreeDataItem, UUID} from "../data/types"
import type { TreeItemProps } from "./TreeViewMaster"

export const EMPTY_GUID = '00000000-0000-0000-0000-000000000000'

export function reloadMaster() {
    refresh();
    _renderFunc(++_render);
}

let _selectedItem : TreeDataItem;
let _render = 0;
let _renderFunc : (r: number) => void;

export type MasterDetailProps = {
    api: string,
    item?: (props: TreeItemProps) => React.ReactElement,
    stubMessage: string,
    type: string,
    detail: React.ReactElement,
    path: string
}

export function MasterDetail(props : MasterDetailProps) {
    const { path } = useBasePath();
    const navigate = useNavigate();
    return (
        <SmartScroll offtop={10}>
            <div style={{ flex: 1 }}>
                <SmartScrollContent>
                    <TreeViewMaster api={props.api}
                        onCurrentRootChanged={(root) => (_selectedItem = root)}
                        item={props.item}
                    />
                </SmartScrollContent>
            </div>
            <div style={{ flex: 5, marginLeft: '1rem' }}>
                <SmartScrollContent>
                    <Routes>
                        <Route index element={<DetailStub message={props.stubMessage} />} />
                        <Route path={'folder/:id'} element={
                            <Folder
                                api={api.directories}
                                type={props.type}
                                path={path}
                                onChange={() => reloadMaster()}
                                onClose={() => navigate(path)}
                            />
                        } />
                        <Route path={':id'} element={
                            <>
                                {props.detail}
                                <div style={{ height: '40vh' }}>{ /*div to avoid ui jerking when switching cards at bottom*/}</div>
                            </>
                        } />
                    </Routes>
                </SmartScrollContent>
            </div>
        </SmartScroll>
    );
}

export type DetailProps = {
    card?: React.ReactNode,
    icon?: React.ReactElement,
    editor?: React.ReactNode,
    relations?: React.ReactNode,
    subDetail?: React.ReactElement,
    id?: UUID,
    loading?: boolean,
    error?: string,
    validation?: string,
    data?: DataItem,
    onChange?: DetailEventHandler,
    onClose: MouseEventHandler,
    onUp?: MouseEventHandler,
    path?: string,
    api: string,
    editMode?: boolean,
    editable?: boolean,
    copyable?: boolean,
    deletable?: boolean
    readonly?: boolean
    title?: string
    subTitle?: string
};

export function Detail({editable = true, copyable = true, deletable =true, readonly = false, ...props} : DetailProps) {
    const navigate = useNavigate();
    const [_, setRefresh] = useState(0);
    _renderFunc = setRefresh;
    let [editMode, setEditMode] = useState(props.editMode);
    editMode = editMode || props.id === EMPTY_GUID;
    return (
        props.error ? <Alert color='danger' style={{ display: 'flex', justifyContent: 'space-around' }}>{props.error}</Alert> :
            <>
                <Card className='animated'>
                    {(props.loading && props.id) && <CardBody><Loading /></CardBody>}
                    {!(props.loading && props.id) &&
                        <>
                            <CardHeader style={{ position: "sticky", top: 0, display: 'flex', justifyContent: "space-between" }}>
                                <div style={{ display: 'flex' }}>
                                    <div className='me-2'>
                                        {props.icon}
                                    </div>
                                    <div>

                                        <CardTitle>{props.title || props.data?.name}</CardTitle>
                                        <CardSubtitle>{props.subTitle || props.data?.description}</CardSubtitle>
                                    </div>
                                </div>
                                <Toolbar style={{ padding: '0', borderStyle: 'none' }}>
                                    <ToolbarItem>
                                        {(props.editor && !readonly) &&
                                            <ButtonGroup>
                                                <ToolbarButton
                                                    visible={editable}
                                                    title={editMode ? 'View mode' : 'Edit mode'}
                                                    icon={editMode ? "eye" : "edit"}
                                                    fillMode='flat'
                                                    onClick={() => setEditMode(!editMode)}
                                                />
                                                <ToolbarButton
                                                    visible={copyable}
                                                    title='Copy'
                                                    fillMode='flat'
                                                    icon='copy'
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        const data = { ...props.data, id: 0, name: `${props.data?.name} (Copy)` }
                                                        axios.post(`${props.api}`, data)
                                                            .then((response) => {
                                                                props.onChange && props.onChange()
                                                                props.path && navigate(`${props.path}/${response.data.id}`)
                                                            });
                                                    }}
                                                />
                                                <ToolbarButton
                                                    visible={deletable}
                                                    title='Delete'
                                                    fillMode='flat'
                                                    icon='delete'
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (window.confirm('Confirm deleting entity')) {
                                                            axios.delete(`${props.api}/${props.data?.id}`)
                                                                .then(() => {
                                                                    props.onChange && props.onChange()
                                                                    props.path && navigate(props.path)
                                                                });
                                                        }
                                                    }}
                                                />
                                            </ButtonGroup>
                                        }
                                    </ToolbarItem>
                                    <ToolbarItem>
                                        <ButtonGroup>
                                            <ToolbarButton visible={true} title='Move Up' fillMode='flat' icon='arrow-up' onClick={props.onUp} />
                                            <ToolbarButton visible={true} title='Close' fillMode='flat' icon='close' onClick={props.onClose} />
                                        </ButtonGroup>
                                    </ToolbarItem>
                                </Toolbar>
                            </CardHeader>
                            <CardBody>
                                {props.validation && <Alert color='warning' style={{ display: 'flex', justifyContent: 'space-around' }}>{props.validation}</Alert>}
                                {(editMode && props.editor) || props.card}
                                {!editMode && props.relations}
                            </CardBody>
                        </>
                    }
                </Card>
                <div className="mt-2" />
                {props.subDetail}
            </>
    );
}

type ToolbarButtonProps = ButtonProps & {
    visible?: boolean;
}
    
function ToolbarButton({ visible, ...props } : ToolbarButtonProps) {
    return visible ? <Button {...props} /> : null;
}

type InfoProps = {
    content: React.ReactNode,
    //data: TreeNode
}

export function Info(props : InfoProps) {
    return (
        <>
            {props.content}
        </>
    );
}

interface EditorProps extends InfoProps {
    data: DataItem
    setData: DetailEventHandler
    type: string
    onUpdate?: DetailEventHandler
    onChange?: DetailEventHandler
    api: string
    path?: string
}

export function Editor(props : EditorProps) {
    const navigate = useNavigate();
    const handleSubmit = (data: Dictionary) => {
        console.log(data);
        const foreignData = Object.keys(data)
            .reduce((r, d, i, a ) => 
                ({ ...r, [d]: data[d] && typeof data[d] === 'object' && !(data[d] instanceof Date) ? data[d]['id'] : data[d]}), {})
        if (data.id &&  data.id !== EMPTY_GUID) {
            axios.put(`${props.api}/${props.data.id}`, foreignData)
                .then((response) => {
                    props.onUpdate?.(response.data);
                    props.onChange?.(response.data)
                    props.setData(response.data);
                })
        } else {
            const parentId = _selectedItem?.isFolder ? _selectedItem.id : _selectedItem?.directoryId;
            axios.post(`${props.api}`, { ...foreignData, directoryId: parentId })
                .then((response) => {
                    props.onUpdate?.(response.data);
                    props.onChange?.(response.data)
                    props.setData(response.data);
                    navigate(`${props.path}${response.data.isFolder ? '/folder' : ''}/${response.data.id}`);
                });
        }
    };

    return (
        <Form
            key={props.data.id}
            initialValues={props.data}
            onSubmit={handleSubmit}
            render={(formRenderProps) => (
                <FormElement>
                    {props.content}
                    <div className="k-form-buttons" style={{ position: 'sticky', bottom: 10, display: 'flex', justifyContent: 'space-between', backgroundColor: 'white' }}>
                        <Button
                            title='Save'
                            name='save'
                            themeColor={formRenderProps.allowSubmit ? "primary" : "secondary"}
                            icon='save'
                            type={'submit'}
                            disabled={!formRenderProps.allowSubmit}
                        >
                            Save
                        </Button>
                    </div>
                </ FormElement>
            )}
        />
    );
}
