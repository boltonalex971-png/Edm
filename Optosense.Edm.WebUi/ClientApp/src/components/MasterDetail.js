import React, { useState } from "react";
import { useRouteMatch, useHistory, Switch, Route } from "react-router-dom";
import PropTypes from "prop-types";
import axios from 'axios';
import { Card, CardHeader, CardBody, CardTitle, CardSubtitle } from '@progress/kendo-react-layout';
import { Form, FormElement } from '@progress/kendo-react-form';
import { Button, ButtonGroup } from '@progress/kendo-react-buttons';
import { Alert } from 'reactstrap';
import { SmartScroll, SmartScrollContent } from "./SmartScroll";
import { TreeViewMaster, refresh } from "./TreeViewMaster";
import { Loading, DetailStub } from "./utils/Utils";

export function reloadMaster() {
    refresh();
}

MasterDetail.propTypes = {
    card: PropTypes.func,
    editor: PropTypes.func,
    api: PropTypes.string,
    detail: PropTypes.element,
    stubMessage: PropTypes.string
};

export function MasterDetail(props) {
    let { path } = useRouteMatch();
    return (
        <SmartScroll offtop={10}>
            <div className="col-4">
                <SmartScrollContent>
                    <TreeViewMaster api={props.api} />
                </SmartScrollContent>
            </div>
            <div className="col-8">
                <SmartScrollContent>
                    <Switch>
                        <Route exact path={path}>
                            <DetailStub message={props.stubMessage} />
                        </Route>
                        <Route path={`${path}/:id`}>
                            {props.detail}
                        </Route>
                    </Switch>
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
                <Card>
                    {(props.loading && props.id) && <CardBody><Loading /></CardBody>}
                {!(props.loading && props.id) &&
                    <>
                        <CardHeader style={{ position: "sticky", top: 0, display: 'flex', justifyContent: "space-between" }}>
                            <div>
                                <CardTitle>{props.data.name}</CardTitle>
                                <CardSubtitle>{props.data.description}</CardSubtitle>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'nowrap' }}>
                                {props.editor &&
                                    <ButtonGroup>
                                        <Button
                                            title={editMode ? 'View mode' : 'Edit mode'}
                                            icon={editMode ? "eye" : "edit"}
                                            look='clear'
                                            onClick={() => setEditMode(!editMode)}
                                        />
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
                                                        history.push(`${props.path}/${response.data.id}`);
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
                                                            history.push(props.path);
                                                        });
                                                }
                                            }}
                                        />
                                    </ButtonGroup>
                                }
                                {(props.onUp || props.onClose) && <div className='mx-2'></div>}
                                <ButtonGroup>
                                    {props.onUp && <Button title='Move Up' look='clear' icon='arrow-up' onClick={props.onUp} />}
                                    {props.onClose && < Button title='Close' look='clear' icon='close' onClick={props.onClose} />}
                                </ButtonGroup>
                            </div>
                        </CardHeader>
                        <CardBody>
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
    const history = useHistory();
    // const handleDelete = () => {
    //     axios.delete(`${props.api}/${props.data.id}`)
    //         .then(() => { props.onChange(); history.push(props.path) });
    // };
    const handleSubmit = (data) => {
        data.id ?
            axios.put(`${props.api}/${props.data.id}`, data)
                .then((response) => {
                    props.onChange && props.onChange();
                    props.setData(response.data);
                })
            :
            axios.post(`${props.api}`, data)
                .then((response) => {
                    props.onChange && props.onChange();
                    props.setData(response.data);
                    history.push(`${props.path}/${response.data.id}`);
                });
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
                            primary
                            icon='save'
                            type={'submit'}
                            disabled={!formRenderProps.allowSubmit}
                        >
                            Save
                        </Button>
                        {/* <ButtonToolbar>
                            <Button
                                title='Copy'
                                icon='copy'
                                onClick={(e) => {
                                    e.preventDefault();
                                    formRenderProps.onChange('name', { value: `${formRenderProps.valueGetter('name')} (Copy)` });
                                    formRenderProps.onChange('id', { value: 0 });
                                    formRenderProps.onSubmit();
                                }}
                            >
                                Copy
                            </Button>
                            <Button
                                title='Delete'
                                look='bare'
                                icon='delete'
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleDelete();
                                }}
                            >
                                Delete
                            </Button>
                        </ButtonToolbar> */}
                    </div>
                </ FormElement>
            )}
        />
    );
}
