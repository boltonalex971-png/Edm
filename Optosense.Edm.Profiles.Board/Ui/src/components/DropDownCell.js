import React from 'react';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import { GridCell } from '@progress/kendo-react-grid';
import { Input } from '@progress/kendo-react-inputs';

export function DropDownCell({ data, key, text, fieldName, fieldId, editField, onClick, editable = true, ...props }) {
    const handleChange = (e) => {
        const event = {
            dataItem: props.dataItem,
            field: props.field,
            syntheticEvent: e.syntheticEvent,
            value: e.target.value[key]
        };
        props.onChange(event);
        props.dataChange(event);
    }
    let content;
    const { dataItem, field } = props;
    const dataValue = dataItem[field];
    const list = data || [];
    let value = list.find(c => c[key] === dataValue);
    if (data && dataItem[editField] && editable) {
        content = <DropDownList
            onChange={handleChange}
            value={value}
            data={list}
            textField={text}
            dataItemKey={key}
        />;
    } else {
        const valueName = fieldName ? dataItem[fieldName] : ((value && value[text]) || '- DELETED -');
        const valueId = fieldId ? dataItem[fieldId] : value ? value[key] : dataItem[field];
        content = <span>{valueName}</span>;
    }

    return (
        <td style={{ whiteSpace: 'nowrap' }}>
            {content}
        </td>
    );
}

export function linkTextCell({ fieldId, onClick, template, editable = true }) {
    return class extends GridCell {
        handleChange = (e) => {
            this.props.onChange({
                dataItem: this.props.dataItem,
                field: this.props.field,
                syntheticEvent: e.syntheticEvent,
                value: e.target.value
            });
        }

        render() {
            let content;
            const { dataItem, field } = this.props;
            const value = template || dataItem[field];
            if (dataItem.inEdit && editable) {
                content = <Input onChange={this.handleChange} value={value} />;
            } else {
                const id = dataItem[fieldId || "id"];
                content = <button type='button' onClick={() => onClick(id)} className='btn btn-link'>{value}</button>;
            }

            return (
                <td style={{ whiteSpace: 'nowrap' }}>
                    {content}
                </td>
            )
        }
    }
}
