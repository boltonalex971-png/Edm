import React from 'react';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import { GridCell } from '@progress/kendo-react-grid';

export function dropDownCell(getData, key, text) {
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
            const list = getData();
            const { dataItem, field } = this.props;
            const dataValue = dataItem[field];
            return (
                <td style={{ whiteSpace: 'nowrap' }}>
                    {dataItem.inEdit ? (
                        <DropDownList
                            onChange={this.handleChange}
                            value={list.find(c => c[key] === dataValue)}
                            data={list}
                            textField={text}
                            dataItemKey={key}
                        />
                    ) : (
                            list.find(c => c[key] === dataValue)[text].toString()
                        )}
                </td>
            )
        }
    }
}

// export class DropDownCell extends React.Component {

//     handleChange = (e) => {
//         this.props.onChange({
//             dataItem: this.props.dataItem,
//             field: this.props.field,
//             syntheticEvent: e.syntheticEvent,
//             value: e.target.value.value
//         });
//     }

//     render() {
//         const { dataItem, field } = this.props;
//         const dataValue = dataItem[field] === null ? '' : dataItem[field];

//         return (
//             <td>
//                 {dataItem.inEdit ? (
//                     <DropDownList
//                         style={{ width: "100px" }}
//                         onChange={this.handleChange}
//                         value={this.localizedData.find(c => c.value === dataValue)}
//                         data={this.localizedData}
//                         textField="text"
//                     />
//                 ) : (
//                         dataValue.toString()
//                     )}
//             </td>
//         );
//     }
// }
