import React
    from 'react';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import { GridCell } from '@progress/kendo-react-grid';

export function dropDownCell(getData, key, text, fieldName) {
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
            const dataName = dataItem[fieldName];
            if (dataItem.inEdit || !fieldName) {
                const list = getData();
                const value = list.find(c => c[key] === dataValue);
                content = dataItem.inEdit ?
                    < DropDownList
                        onChange={this.handleChange}
                        value={value}
                        data={list}
                        textField={text}
                        dataItemKey={key}
                    /> : (value && value[text] || '- DELETED -').toString();
            } else if (fieldName) {
                content = dataItem[fieldName];
            } 

            return (
                <td style={{ whiteSpace: 'nowrap' }}>
                    {content}
                </td>
            )
        }
    }
}
