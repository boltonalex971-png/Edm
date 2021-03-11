import React, { useState } from "react";
import { useRouteMatch, useHistory, Switch, Route } from "react-router-dom";
import PropTypes from "prop-types";
import axios from 'axios';
import { Card, CardHeader, CardBody, CardTitle, CardSubtitle } from '@progress/kendo-react-layout';
import { Form, FormElement } from '@progress/kendo-react-form';
import { Button, ButtonGroup } from '@progress/kendo-react-buttons';
import { SmartScroll, SmartScrollContent } from "./SmartScroll";
import { TreeViewMaster } from "./TreeViewMaster";

MasterDetail.propTypes = {
    card: PropTypes.func,
    editor: PropTypes.func,
    data: PropTypes.array,
    detail: PropTypes.element,
    loading: PropTypes.bool,
    stubMessage: PropTypes.string,
    onItemClick: PropTypes.func
};

export function MasterDetail(props) {
    return (
        <SmartScroll offtop={10}>
            <div style={{ flex: 1 }}>
                <SmartScrollContent>
                    <TreeViewMaster data={props.data} onItemClick={props.onItemClick} />
                </SmartScrollContent>
            </div>
            <div style={{ flex: 4, marginLeft: '1rem' }}>
                <SmartScrollContent>
                    {props.detail}
                </SmartScrollContent>
            </div>
        </SmartScroll>
    );
}

Detail.propTypes = {
    card: PropTypes.node,
    editor: PropTypes.node,
    relations: PropTypes.node,
    subDetail: PropTypes.element,
    id: PropTypes.any,
    loading: PropTypes.any,
    error: PropTypes.any,
    data: PropTypes.object,
    onChange: PropTypes.func,
    onClose: PropTypes.func,
    onUp: PropTypes.func,
    path: PropTypes.string,
    api: PropTypes.string,
    editable: PropTypes.bool,
    copyable: PropTypes.bool,
    deletable: PropTypes.bool,
    stub: PropTypes.string
};

Detail.defaultProps = {
    editable: true,
    copyable: true,
    deletable: true,
};

export function Detail(props) {
    return (
        <>
            {!props.data && <div style={{ display: 'flex', justifyContent: 'center' }}>{props.stub}</div>}
            {props.data &&
                <Card>
                    <CardHeader style={{ position: "sticky", top: 0, display: 'flex', justifyContent: "space-between" }}>
                        <div>
                            <CardTitle>{(props.data && props.data.name) || ' '}</CardTitle>
                            <CardSubtitle>{(props.data && props.data.description) || ' '}</CardSubtitle>
                        </div>
                        {/* <div style={{ display: 'flex', flexWrap: 'nowrap' }}>
                            <ButtonGroup>
                                <Button
                                    title='Copy'
                                    look='clear'
                                    icon='copy'
                                    onClick={(e) => {
                                        e.preventDefault();
                                        let data = { ...props.data, id: 0, name: `${props.data.name} (Copy)` };
                                        axios.post(`${props.api}`, data)
                                            .then((response) => {
                                                props.onChange();
                                            });
                                    }}
                                />
                                <Button
                                    title='Delete'
                                    look='clear'
                                    icon='delete'
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (window.confirm('Confirm deleting entity')) {
                                            axios.delete(`${props.api}/${props.data.id}`)
                                                .then(() => {
                                                    props.onChange();
                                                });
                                        }
                                    }}
                                />
                            </ButtonGroup>
                        </div> */}
                    </CardHeader>
                    <CardBody>
                        {props.card}
                    </CardBody>
                </Card>
            }
        </>
    );
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
    setData: PropTypes.func
}

export function Editor(props) {
    const handleSubmit = (data) => {
        props.setData(data);
    };
    const handleDelete = (data) => {
        props.setData({ ...data, deleted: true });
    };
    return (
        <Form
            initialValues={props.data}
            onSubmit={handleSubmit}
            render={(formRenderProps) => (
                <FormElement>
                    {props.content}
                    <div className="k-form-buttons" style={{ position: 'sticky', bottom: 10, display: 'flex', justifyContent: 'space-between', backgroundColor: 'white' }}>
                        <Button
                            title='Delete'
                            name='delete'
                            icon='delete'
                            type={'button'}
                            onClick={() => handleDelete(props.data)}
                        >
                            Delete
                        </Button>
                        <Button
                            title='Save'
                            name='save'
                            primary
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
