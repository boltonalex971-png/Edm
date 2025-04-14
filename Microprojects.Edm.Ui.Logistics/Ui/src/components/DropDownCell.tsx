import React, { useContext } from 'react';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import {Input, InputChangeEvent} from '@progress/kendo-react-inputs';
import { ParentContext } from './ParentContext';
import {DropDownListChangeEvent} from "@progress/kendo-react-dropdowns/dist/npm/DropDownList/DropDownListProps";

type EditableCellProps = {
    inEdit: boolean;
}

type DropDownCompProps = {
    onChange: Function,
    field: string,
    dataItem: any,
    dataItemKey: string,
    data: [],
    value: any
}

export const DropDownComp = (props : DropDownCompProps) => {
    const handleChange = (e : DropDownListChangeEvent) : void => {
        props.onChange({
            dataItem: props.dataItem,
            field: props.field,
            syntheticEvent: e.syntheticEvent,
            value: e.target.value[props.dataItemKey]
        });
    }
    const value = (props.data || []).find(c => c[props.dataItemKey] === props.value) || {};
    return (
        <DropDownList {...props} data={props.data || []} onChange={handleChange} value={value} />
    );
};

interface DropDownCellProps extends EditableCellProps  {
    getData: Function,
    onClick: Function,
    onChange: Function,
    dataItem: any,
    field: string,
    id: string,
    text: string,
    fieldName: string,
    fieldId: string,
    editable: boolean,
    template: string
}

export const DropDownCell = ({ getData, id, text, fieldName, fieldId, onClick, editable = true, ...props } : DropDownCellProps) => {
    const context = useContext(ParentContext)
    const handleChange = (e : DropDownListChangeEvent) : void => {
        const event = {
            dataItem: props.dataItem, //e.value,
            field: props.field,
            syntheticEvent: e.syntheticEvent,
            value: e.target.value[id]
        };
        props.onChange(event);
    }
    let content : React.ReactNode;
    const { dataItem, field } = props;
    const dataValue = dataItem[field];
    const list = (getData && getData()) || [];
    let value = list.find((c : any) => c[id] === dataValue);
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

interface LinkTextCellProps extends EditableCellProps{
    getData: Function,
    onClick: Function,
    onChange: Function,
    dataItem: EditableCellProps & any,
    inEditField: string,
    field: string,
    id: string,
    text: string,
    fieldName: string,
    fieldId: string,
    editable: boolean,
    template: string
}
export const LinkTextCell = ({ fieldId, onClick, template, editable = true, ...props } : LinkTextCellProps) => {
    const context = useContext(ParentContext)
    const handleChange = (e : InputChangeEvent) : void => {
        props.onChange({
            dataItem: props.dataItem,
            field: props.field,
            value: e.target.value
        });
    }
    let content: React.ReactElement;
    const { dataItem, field } = props;
    const value = template || dataItem[field];
    if (dataItem.inEdit) {
        content = editable ?
            <Input onChange={handleChange} value={value} /> :
            <></>;
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


