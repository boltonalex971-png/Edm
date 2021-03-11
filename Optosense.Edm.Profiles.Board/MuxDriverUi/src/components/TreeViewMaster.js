import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Alert, Card, InputGroup, InputGroupAddon, Input as BootInput, InputGroupText } from 'reactstrap';
import { TreeView } from '@progress/kendo-react-treeview';
import { Button } from '@progress/kendo-react-buttons';

TreeViewMaster.propTypes = {
    api: PropTypes.string,
    error: PropTypes.string,
    loading: PropTypes.bool,
    data: PropTypes.array,
    onItemClick: PropTypes.func
}

const StyledTreeView = styled(TreeView)`
    overflow-x: hidden;
`;

export function TreeViewMaster({ data, error, loading, ...props }) {
    const [filter, setFilter] = useState('');
    const filteredData = data && data
        .filter((el) => el.name && el.name.toUpperCase().includes(filter.toUpperCase()))
        .sort((a, b) => a.name.toUpperCase().localeCompare(b.name.toUpperCase()));
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
                    <Button icon='add' look='clear' title='Add new' onClick={() => props.onItemClick({})} style={{ justifySelf: 'end' }} />
                </div>
                {error ?
                    <Alert color='danger' style={{ display: 'flex', justifyContent: 'space-around' }}>{error}</Alert> :
                    loading ?
                        <div /> :
                        <StyledTreeView
                            focusIdField='id'
                            item={(el) => (<span key={el.item.id} className={el.item.items ? "font-weight-bolder" : ""}>{el.item.name}</span>)}
                            expandIcons
                            data={filteredData}
                            onItemClick={(e) => props.onItemClick(e.item)}
                            onExpandChange={(e) => {
                                e.item.expanded = !e.item.expanded;
                            }}
                        />
                }
            </Card>
        </>
    );
}
