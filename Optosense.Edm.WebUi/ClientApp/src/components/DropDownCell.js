import React
    from 'react';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import { GridCell } from '@progress/kendo-react-grid';
import { Input } from '@progress/kendo-react-inputs';
import { post } from 'jquery';

export const DropDownComp = ({ ...props }) => {
    const handleChange = (e) => {
        props.onChange({
            dataItem: props.dataItem,
            field: props.field,
            syntheticEvent: e.syntheticEvent,
            value: e.target.value[props.dataItemKey]
        });
    }
    const value = (props.data || []).find(c => c[props.dataItemKey] === props.value);
    return (
        <DropDownList  {...props} onChange={handleChange} value={value} />
    );
}

export function dropDownCell({ getData, key, text, fieldName, fieldId, onClick, editable = true }) {
    return class extends GridCell {
        handleChange = (e) => {
            this.props.onChange({
                dataItem: this.props.dataItem,
                field: this.props.field,
                syntheticEvent: e.syntheticEvent,
                value: e.target.value[key]
            });
        }

        render() {
            let content;
            const { dataItem, field } = this.props;
            const dataValue = dataItem[field];
            const list = getData && getData() || [];
            let value = list.find(c => c[key] === dataValue);
            if (getData && dataItem.inEdit && editable) {
                content = <DropDownList
                    onChange={this.handleChange}
                    value={value}
                    data={list}
                    textField={text}
                    dataItemKey={key}
                />;
            } else if (onClick) {
                const valueName = fieldName ? dataItem[fieldName] : (value && value[text] || dataItem[fieldId]);
                const valueId = fieldId ? dataItem[fieldId] : value ? value[key] : dataItem[field];
                content = <button type='button' onClick={() => onClick(valueId)} className='btn btn-link'>{valueName}</button>;
            } else {
                const valueName = fieldName ? dataItem[fieldName] : (value && value[text] || dataItem[fieldId]);
                content = <span>{valueName}</span>;
            }

            return (
                <td style={{ whiteSpace: 'nowrap' }}>
                    {content}
                </td>
            )
        }
    }
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
