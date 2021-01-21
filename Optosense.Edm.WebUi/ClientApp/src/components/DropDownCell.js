import React
    from 'react';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import { GridCell } from '@progress/kendo-react-grid';

export function dropDownCell({ getData, key, text, fieldName, fieldId, onClick }) {
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
            if (getData && dataItem.inEdit) {
                content = <DropDownList
                    onChange={this.handleChange}
                    value={value}
                    data={list}
                    textField={text}
                    dataItemKey={key}
                />;
            } else {
                const valueName = fieldName ? dataItem[fieldName] : (value && value[text] || '- DELETED -');
                const valueId = fieldId ? dataItem[fieldId] : value ? value[key] : dataItem[field];
                content = <button type='button' onClick={() => onClick(valueId)} className='btn btn-link'>{valueName}</button>;
            }

            return (
                <td style={{ whiteSpace: 'nowrap' }}>
                    {content}
                </td>
            )
        }
    }
}
