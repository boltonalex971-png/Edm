import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Grid, GridColumn, GridToolbar } from '@progress/kendo-react-grid';
import { Button, ButtonGroup } from '@progress/kendo-react-buttons';

const getId = () => Math.floor(Math.random() * 1000000);
const editField = '_inEdit';
const expandedField = '_expanded';
const idField = '_id';

export const EasyGrid = (props) => {
    const [data, setData] = useState(() => props.data
        .map(d => ({ [idField]: getId(), ...d }))
        .sort((a, b) => props.orderField ? a[props.orderField] - b[props.orderField] : -1))
    const [origin, setOrigin] = useState();
    const dataChange = (d) => {
        setData(d);
        props.dataChange(d.map(i => {
            const { [editField]: _1, [expandedField]: _2, [idField]: _3, ...item } = i;
            return item;
        }));
    };
    const expandChange = e => {
        data.find(i => i[idField] === e.dataItem[idField])[expandedField] = e.value;
        setData([...data]);
    };
    const addNew = () => {
        const newDataItem = { [editField]: true };
        setData([newDataItem, ...data]);
    };
    const itemChange = e => {
        data.find(i => i[idField] === e.dataItem[idField])[e.field] = e.value;
        setData([...data]);
    };
    const remove = dataItem => {
        const upd = data.filter(i => i[idField] !== dataItem[idField]);
        //setData(upd);
        dataChange(upd);
    };
    const add = dataItem => {
        dataItem[editField] = false;
        dataItem[idField] = getId();
        //setData([...data])
        dataChange([...data]);
    };
    const update = dataItem => {
        dataItem[editField] = null;
        const sorted = data.sort((a, b) => (a.order || 0) - (b.order || 0));
        //setData([...sorted]);
        dataChange([...sorted]);
    };
    const discard = dataItem => {
        setData(data.filter(i => i[idField] !== dataItem[idField]));
    };
    const cancel = dataItem => {
        const index = data.findIndex(i => i[idField] === dataItem[idField]);
        data[index] = origin;
        setData([...data]);
    };
    const enterEdit = dataItem => {
        setOrigin({ ...dataItem, [editField]: null });
        setData(data.map(i => ({ ...i, [editField]: i[idField] === dataItem[idField] })));
    };
    const detailsChanged = (dataItem) => {
        const index = data.findIndex(i => i[idField] === dataItem[idField]);
        data[index] = dataItem;
        //setData([...data]);
        dataChange([...data]);
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
                <Grid data={data}
                    detail={props.details && ((detailProps) => props.details({ dataChanged: detailsChanged, ...detailProps }))}
                    id={idField} editField={editField} expandField={expandedField}
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
    const inEdit = dataItem[editField];
    const isNewItem = dataItem[idField] === undefined;

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
