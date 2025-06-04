import React, { useState } from "react";
import { useRouteMatch, useHistory, Switch, Route } from "react-router-dom";
import PropTypes from "prop-types";
import axios from 'axios';
import { Card, CardHeader, CardBody, CardTitle, CardSubtitle } from '@progress/kendo-react-layout';
import { Form, FormElement } from '@progress/kendo-react-form';
import { Button, ButtonGroup } from '@progress/kendo-react-buttons';
import { SmartScroll, SmartScrollContent } from "./SmartScroll";
import { TreeViewMaster } from "./TreeViewMaster";
import { Alert } from "reactstrap";
import { Loader } from "@progress/kendo-react-indicators";

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
        <SmartScroll offtop={20}>
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
        props.error ? <Alert color='danger' style={{ display: 'flex', justifyContent: 'space-around' }}>{props.error}</Alert> :
            <>

                {!props.data?.displayName && <div style={{ display: 'flex', justifyContent: 'center' }}>{props.stub}</div>}
                {props.data &&
                    <>
                        {props.loading && <CardBody><Loading /></CardBody>}
                        {(!props.loading && props.data?.displayName) &&
                            <Card className='animated'>
                                <CardHeader style={{ position: "sticky", top: 0, display: 'flex', justifyContent: "space-between" }}>
                                    <div>
                                        <CardTitle>{(props.data && props.data.displayName.Text) || ' '}</CardTitle>
                                        <CardSubtitle>{(props.data && props.data.description?.Text) || ' '}</CardSubtitle>
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    {props.card}
                                </CardBody>
                            </Card>
                        }
                    </>
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

function Loading() {
    return (
        <div style={{ width: '100%', textAlign: 'center' }} className='small' >
            <Loader type='converging-spinner' />
        </div>
    );
}