import React, { useState } from "react";
import { useRouteMatch, useHistory, Switch, Route, matchPath } from "react-router-dom";
import PropTypes from "prop-types";
import axios from 'axios';
import { Card, CardHeader, CardBody, CardTitle, CardSubtitle } from '@progress/kendo-react-layout';
import { Form, FormElement } from '@progress/kendo-react-form';
import { Button, ButtonGroup, Toolbar, ToolbarItem } from '@progress/kendo-react-buttons';
import { Alert } from 'reactstrap';
import { SmartScroll, SmartScrollContent } from "./SmartScroll";
import { TreeViewMaster, refresh } from "./TreeViewMaster";
import { Loading, DetailStub } from "./utils/Utils";
import api from './api';
import { Folder } from "./config/Folder";

export function reloadMaster() {
    refresh();
}

let _selectedItem;

MasterDetail.propTypes = {
    card: PropTypes.func,
    type: PropTypes.string,
    editor: PropTypes.func,
    api: PropTypes.string,
    detail: PropTypes.element,
    item: PropTypes.func,
    stubMessage: PropTypes.string
};

export function MasterDetail(props) {
    const history = useHistory();
    let { path } = useRouteMatch();
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
                    <Switch>
                        <Route exact path={path}>
                            <DetailStub message={props.stubMessage} />
                        </Route>
                        <Route path={`${path}/folder/:id`}>
                            <Folder
                                api={api.hierarchies}
                                type={props.type}
                                path={path}
                                onChange={() => reloadMaster()}
                                onClose={() => history.push(path)}
                            />
                        </Route>
                        <Route path={`${path}/:id`}>
                            <>
                                {props.detail}
                                <div style={{ height: '40vh' }}>{ /*div to avoid ui jerking when switching cards at bottom*/}</div>
                            </>
                        </Route>
                    </Switch>
                </SmartScrollContent>
            </div>
        </SmartScroll>
    );
}

Detail.propTypes = {
    card: PropTypes.node,
    icon: PropTypes.element,
    editor: PropTypes.node,
    relations: PropTypes.node,
    subDetail: PropTypes.element,
    id: PropTypes.any,
    loading: PropTypes.any,
    error: PropTypes.any,
    validation: PropTypes.string,
    data: PropTypes.object,
    onChange: PropTypes.func,
    onClose: PropTypes.func,
    onUp: PropTypes.func,
    path: PropTypes.string,
    api: PropTypes.string,
    editable: PropTypes.bool,
    copyable: PropTypes.bool,
    deletable: PropTypes.bool
};

Detail.defaultProps = {
    editable: true,
    copyable: true,
    deletable: true,
};

export function Detail(props) {
    const history = useHistory();
    let [editMode, setEditMode] = useState(false);
    editMode = editMode || props.id === 0;
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

                                        <CardTitle>{props.data.name}</CardTitle>
                                        <CardSubtitle>{props.data.description}</CardSubtitle>
                                    </div>
                                </div>
                                <Toolbar style={{ padding: '0', borderStyle: 'none' }}>
                                    <ToolbarItem>
                                        {props.editor &&
                                            <ButtonGroup>
                                                <ToolbarButton
                                                    visible={props.editable}
                                                    title={editMode ? 'View mode' : 'Edit mode'}
                                                    icon={editMode ? "eye" : "edit"}
                                                    fillMode='flat'
                                                    onClick={() => setEditMode(!editMode)}
                                                />
                                                <ToolbarButton
                                                    visible={props.copyable}
                                                    title='Copy'
                                                    fillMode='flat'
                                                    icon='copy'
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        let data = { ...props.data, id: 0, name: `${props.data.name} (Copy)` };
                                                        axios.post(`${props.api}`, data)
                                                            .then((response) => {
                                                                props.onChange();
                                                                history.push(`${props.path}/${response.data.id}`);
                                                            });
                                                    }}
                                                />
                                                <ToolbarButton
                                                    visible={props.deletable}
                                                    title='Delete'
                                                    fillMode='flat'
                                                    icon='delete'
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (window.confirm('Confirm deleting entity')) {
                                                            axios.delete(`${props.api}/${props.data.id}`)
                                                                .then(() => {
                                                                    props.onChange();
                                                                    history.push(props.path);
                                                                });
                                                        }
                                                    }}
                                                />
                                            </ButtonGroup>
                                        }
                                    </ToolbarItem>
                                    <ToolbarItem>
                                        <ButtonGroup>
                                            <ToolbarButton visible={props.onUp} title='Move Up' fillMode='flat' icon='arrow-up' onClick={props.onUp} />
                                            <ToolbarButton visible={props.onClose} title='Close' fillMode='flat' icon='close' onClick={props.onClose} />
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
                <div className="mt-2"></div>
                {props.subDetail}
            </>
    );
}

function ToolbarButton({ visible, ...props }) {
    return visible ? <Button {...props} /> : null;
}

Info.propTypes = {
    content: PropTypes.element,
}

export function Info(props) {
    return (
        <>
            {props.content}
        </>
    );
}

Editor.propTypes = {
    ...Info.propTypes,
    setData: PropTypes.func,
    type: PropTypes.string
}

export function Editor(props) {
    const history = useHistory();
    const handleSubmit = (data) => {

        if (data.id) {
            axios.put(`${props.api}/${props.data.id}`, data)
                .then((response) => {
                    props.onChange && props.onChange();
                    props.setData(response.data);
                })
        } else {
            const parentId = _selectedItem ? (_selectedItem.isNode ? _selectedItem.id : _selectedItem.parentId) : 0;
            axios.post(`${props.api}`, { ...data, type: props.type, parentId: parentId, hierarchyId: parentId })
                .then((response) => {
                    props.onChange && props.onChange();
                    props.setData(response.data);
                    history.push(`${props.path}${response.data.isNode ? '/folder' : ''}/${response.data.id}`);
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
                            primary='true'
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
