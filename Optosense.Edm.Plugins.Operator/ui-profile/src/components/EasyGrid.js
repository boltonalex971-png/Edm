import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Grid, GridColumn, GridToolbar } from '@progress/kendo-react-grid';
import { Button, ButtonGroup } from '@progress/kendo-react-buttons';
import { orderBy } from '@progress/kendo-data-query';

export const EasyGrid = (props) => {
    const editField = 'inEdit';
    const expandedField = 'expanded';
    const [data, setData] = useState(props.data);
    const [origin, setOrigin] = useState();
    const dataChange = (d) =>
        props.dataChange(d.map(i => {
            const { edit, expanded, ...item } = i;
            return item;
        }));
    const expandChange = e => {
        data.find(i => i.id === e.dataItem.id).expanded = e.value;
        setData([...data]);
    };
    const addNew = () => {
        const newDataItem = { edit: true };
        setData([newDataItem, ...data]);
    };
    const itemChange = e => {
        data.find(i => i.id === e.dataItem.id)[e.field] = e.value;
        setData([...data]);
    };
    const remove = dataItem => {
        const upd = data.filter(i => i.id !== dataItem.id);
        setData(upd);
        dataChange(upd);
    };
    const add = dataItem => {
        dataItem[editField] = false;
        dataItem.id = Math.round(Math.random() * 1000000);
        setData([...data])
        dataChange(data);
    };
    const update = dataItem => {
        dataItem[editField] = false;
        setData([...data]);
        dataChange(data);
    };
    const discard = dataItem => {
        setData(data.filter(i => i.id !== dataItem.id));
    };
    const cancel = dataItem => {
        const index = data.findIndex(i => i.id === dataItem.id);
        data[index] = origin;
        setData([...data]);
    };
    const enterEdit = dataItem => {
        setOrigin({ ...dataItem, [editField]: false });
        setData(data.map(i => ({ ...i, [editField]: i.id === dataItem.id })));
    };
    const detailsChanged = (dataItem) => {
        const index = data.findIndex(i => i.id === dataItem.id);
        data[index] = dataItem;
        setData([...data]);
        dataChange(data);
    };
    const commandCell = props => (
        <CommandCell
            {...props}
            edit={enterEdit}
            remove={remove}
            add={add}
            discard={discard}
            update={update}
            cancel={cancel}
            editField={editField}
        />
    );
    return (
        <>
            {data &&
                <Grid data={orderBy(data, [{ field: props.orderField, dir: 'asc' }])}
                    detail={props.details && ((detailProps) => props.details({ dataChanged: detailsChanged, ...detailProps }))}
                    editField={editField} expandField={expandedField}
                    onExpandChange={expandChange}
                    onItemChange={itemChange}
                    scrollable='none'
                    style={props.style}
                >
                    <GridToolbar>
                        <Button title="Add new" icon='plus' onClick={addNew} />
                    </GridToolbar>
                    {props.children}
                    <GridColumn cell={commandCell} />
                </Grid>
            }
        </>
    );
};

EasyGrid.propTypes = {
    data: PropTypes.array,
    orderField: PropTypes.string,
    details: PropTypes.func,
    dataChange: PropTypes.func
};


const CommandCell = props => {
    const { dataItem } = props;
    const inEdit = dataItem[props.editField];
    const isNewItem = dataItem.id === undefined;

    return inEdit ? (
        <td className="k-command-cell" width={100}>
            <ButtonGroup>
                <Button icon='floppy' look='clear' onClick={() => (isNewItem ? props.add(dataItem) : props.update(dataItem))} />
                <Button icon='close' look='clear' onClick={() => (isNewItem ? props.discard(dataItem) : props.cancel(dataItem))} />
            </ButtonGroup>
        </td>
    ) : (
        <td className="k-command-cell" width={100}>
            <ButtonGroup>
                <Button icon='pencil' look='clear' onClick={() => props.edit(dataItem)} />
                <Button icon='delete' look='clear' onClick={() =>
                    window.confirm("Confirm deleting: " + dataItem.ProductName) &&
                    props.remove(dataItem)
                }
                />
            </ButtonGroup>
        </td>
    );
};
