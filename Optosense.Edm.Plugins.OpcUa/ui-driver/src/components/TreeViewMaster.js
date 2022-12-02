import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Alert, Card, InputGroup, InputGroupAddon, Input as BootInput, InputGroupText } from 'reactstrap';
import { TreeView, processTreeViewItems } from '@progress/kendo-react-treeview';
import { Button } from '@progress/kendo-react-buttons';
import { Input } from '@progress/kendo-react-inputs';
import { useGet } from './hooks';
import { ApiContext, EndpointContext } from "../Contexts";
import axios from 'axios';

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

export function TreeViewMaster({ onItemClick }) {
    const endpoint = useContext(EndpointContext);
    const api = useContext(ApiContext);
    const [root, setRoot, loading, error] = useGet(`${api}/nodes`, { endpoint });
    const [expand, setExpand] = useState({
        ids: [],
        idField: "id",
    });
    const onExpandChange = (event) => {
        let ids = expand.ids.slice();
        const index = ids.indexOf(event.item.id);
        index === -1 ? ids.push(event.item.id) : ids.splice(index, 1);
        setExpand({
            ids,
            idField: "id",
        });
        if (!event.item.items[0].items && index === -1) {
            const newRoot = root.slice();
            axios.get(`${api}/nodes?${new URLSearchParams({ endpoint, id: event.item.id })}`)
                .then((response => {
                    event.item.items = response.data;
                    setRoot(newRoot);
                }));
        }
    };

    return (
        <>
            <Card style={{ backgroundColor: 'rgba(248,249,250,1)' }}>
                {/* <div style={{ display: 'inline-flex', alignItems: 'center', width: '100%', paddingLeft: '10px' }}>
                    <span className='k-icon k-i-search' style={{ alignSelf: 'center', paddingRight: '10px' }}></span>
                    <Input
                        //bsSize='sm'
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div> */}
                {error ?
                    <Alert color='danger' style={{ display: 'flex', justifyContent: 'space-around' }}>{error}</Alert> :
                    loading ?
                        <div /> :
                        <StyledTreeView
                            focusIdField='id'
                            item={(el) => (<span key={el.item.id} className={el.item.items ? "font-weight-bolder" : ""}>{el.item.name}</span>)}
                            expandIcons
                            data={processTreeViewItems(root, { expand: expand })}
                            onItemClick={(e) => onItemClick(e.item)}
                            onExpandChange={onExpandChange}
                        />
                }
            </Card>
        </>
    );
}
