import React, { useContext, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import { GridCell } from '@progress/kendo-react-grid';
import { Input } from '@progress/kendo-react-inputs';
import { ParentContext } from './ParentContext';

export const DropDownComp = (props) => {
    const handleChange = (e) => {
        props.onChange({
            dataItem: props.dataItem,
            field: props.field,
            syntheticEvent: e.syntheticEvent,
            value: props.dataItemKey ? e.target.value[props.dataItemKey] : e.target.value
        });
    }
    const data = props.data || [];
    const value = props.dataItemKey ?
        (data.find(c => c[props.dataItemKey] === props.value) || {}) :
        (data.find(c => c === props.value) || props.value || "");

    return (
        <DropDownList {...props} data={data} onChange={handleChange} value={value} defaultItem={props.dataItemKey ? {} : ""} />
    );
}

DropDownComp.propTypes = {
    onChange: PropTypes.func,
    field: PropTypes.string,
    dataItem: PropTypes.object,
    dataItemKey: PropTypes.string,
    data: PropTypes.array,
    value: PropTypes.any
}

export const DropDownCell = ({ getData, id, text, fieldName, fieldId, onClick, editable = true, ...props }) => {
    const context = useContext(ParentContext)
    const handleChange = (e) => {
        const event = {
            dataItem: props.dataItem, //e.value,
            field: props.field,
            syntheticEvent: e.syntheticEvent,
            value: e.target.value[id]
        };
        props.onChange(event);
    }
    let content;
    const { dataItem, field } = props;
    const dataValue = dataItem[field];
    const list = (getData && getData()) || [];
    let value = list.find(c => c[id] === dataValue);
    if (getData && dataItem.inEdit && editable) {
        content = <DropDownList
            onChange={handleChange}
            value={value}
            data={list}
            textField={text}
            dataItemKey={id}
        />;
    } else if (onClick) {
        const valueName = fieldName ? dataItem[fieldName] : ((value && value[text]) || dataItem[fieldId]);
        const valueId = fieldId ? dataItem[fieldId] : value ? value[id] : dataItem[field];
        content = <button type='button' onClick={() => onClick(valueId, context.itemUpdate)} className='btn btn-link'>{valueName}</button>;
    } else {
        const valueName = fieldName ? dataItem[fieldName] : ((value && value[text]) || '');
        content = <span>{valueName}</span>;
    }

    return (
        <td style={{ whiteSpace: 'nowrap' }}>
            {content}
        </td>
    )
}

DropDownCell.propTypes = {
    getData: PropTypes.func,
    onClick: PropTypes.func,
    dataItem: PropTypes.object,
    inEdit: PropTypes.string,
    field: PropTypes.string,
    id: PropTypes.string,
    text: PropTypes.string,
    fieldName: PropTypes.string,
    fieldId: PropTypes.string,
    editable: PropTypes.bool
}

export const LinkTextCell = ({ fieldId, onClick, template, editable = true, ...props }) => {
    const context = useContext(ParentContext)
    const handleChange = (e) => {
        props.onChange({
            dataItem: props.dataItem,
            field: props.field,
            value: e.target.value
        });
    }
    let content;
    const { dataItem, field } = props;
    const value = template || dataItem[field];
    if (dataItem.inEdit) {
        content = editable ?
            <Input onChange={handleChange} value={value} /> :
            <span />;
    } else {
        const id = dataItem[fieldId || "id"];
        content = <button type='button' onClick={() => onClick(id, context.itemUpdate)} className='btn btn-link'>{value}</button>;
    }

    return (
        <td style={{ whiteSpace: 'nowrap' }}>
            {content}
        </td>
    );
}

LinkTextCell.propTypes = {
    getData: PropTypes.func,
    onClick: PropTypes.func,
    dataItem: PropTypes.object,
    inEdit: PropTypes.string,
    field: PropTypes.string,
    id: PropTypes.string,
    text: PropTypes.string,
    fieldName: PropTypes.string,
    fieldId: PropTypes.string,
    editable: PropTypes.bool
}

