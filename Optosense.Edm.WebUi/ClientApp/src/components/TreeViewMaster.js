import React, { useState } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Alert, Card, InputGroup, InputGroupAddon, Input as BootInput, InputGroupText } from 'reactstrap';
import { TreeView } from '@progress/kendo-react-treeview';
import { useGet } from './hooks/hooks';
import { Loading } from './utils/Utils';
import { Button } from '@progress/kendo-react-buttons';

TreeViewMaster.propTypes = {
    api: PropTypes.string,
    onItemClick: PropTypes.func
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
    const [[data], loading, error] = useGet(props.api, [render]);
    const [filter, setFilter] = useState('');
    const filteredData = data && data.filter((el) => el.name.toUpperCase().includes(filter.toUpperCase()));
    return (
        <>
            <Card style={{ backgroundColor: 'rgba(248,249,250,1)' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', width: '100%', paddingLeft: '10px' }}>
                    <InputGroup>
                        <InputGroupAddon addonType='prepend'>
                            <InputGroupText>
                                <span className='k-icon k-i-search' style={{ alignSelf: 'center' }}></span>
                            </InputGroupText>
                        </InputGroupAddon>
                        <BootInput
                            bsSize='sm'
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </InputGroup>
                    <Button icon='add' look='flat' title='Add new' onClick={() => history.push(`${url}/0`)} style={{ justifySelf: 'end' }} />
                </div>
                {error ?
                    <Alert color='danger' style={{ display: 'flex', justifyContent: 'space-around' }}>{error}</Alert> :
                    loading ?
                        <Loading /> :
                        <StyledTreeView
                            focusIdField='id'
                            item={(el) => (<span key={el.item.id} className={el.item.items ? "font-weight-bolder" : ""}>{el.item.name}</span>)}
                            expandIcons
                            data={filteredData}
                            onItemClick={(e) => history.push(`${url}/${e.item.id}`)}
                            onExpandChange={(e) => {
                                e.item.expanded = !e.item.expanded;
                            }}
                        />
                }
            </Card>
        </>
    );
}

let _render, _renderFunc;

export function refresh() {
    _renderFunc(++_render);
}
