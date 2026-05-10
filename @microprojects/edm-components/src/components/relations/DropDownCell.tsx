import React, {useContext} from 'react';
import {Select, MenuItem, FormControl, Link as MuiLink, Box} from '@mui/material';
import {ParentContext} from '../master/ParentContext';

// DataGrid cell renderer with three modes:
// - edit (when the row is in edit mode and `editable !== false`): MUI Select bound to `getData()`
// - link (when not editing and `onClick` is provided): MUI Link calling onClick(valueId, parentItemUpdate)
// - plain text fallback
//
// Works with both v2 RelationTable's MUI DataGrid (rows expose `params.row`)
// and legacy callers passing a `dataItem` directly.

export interface DropDownCellProps {
    getData?: () => any[];
    onClick?: (valueId: any, itemUpdate?: () => void) => void;
    dataItem?: any;
    row?: any;
    inEdit?: boolean;
    field?: string;
    id?: any;
    dataKey?: string;
    text?: string;
    fieldName?: string;
    fieldId?: string;
    editable?: boolean;
    value?: any;
    onChange?: (e: {dataItem: any; field?: string; value: any}) => void;
    api?: any;
}

export const DropDownCell = (props: DropDownCellProps) => {
    const {getData, id, dataKey, text, fieldName, fieldId, onClick, editable = true, field, inEdit} = props;
    const dataItem = props.dataItem || props.row;
    const context = useContext(ParentContext);

    if (!dataItem) return null;

    const isEditing = inEdit || dataItem?.inEdit || dataItem?.isNew || (props.api?.getRowMode?.(props.id) === 'edit');
    const dataValue = props.value !== undefined ? props.value : (dataItem ? dataItem[field as string] : null);
    const list = (getData && getData()) || [];

    // Identifier field name in list items.
    // If used in DataGrid (props.api present), props.id is the row ID, so we default to 'id'.
    // Otherwise we use the provided dataKey or fallback to the id prop.
    const keyField = dataKey || (props.api ? 'id' : id) || 'id';
    const value = list.find((c: any) => c[keyField] === dataValue);

    const handleChange = (e: any) => {
        const val = e.target.value;
        // If the value is an object, try to extract the key, otherwise use the value directly
        const newValue = keyField && val && typeof val === 'object'
            ? (val[keyField] !== undefined ? val[keyField] : val)
            : val;

        if (props.onChange) {
            props.onChange({
                dataItem,
                field,
                value: newValue,
            });
        } else if (props.api && props.api.setEditCellValue) {
            props.api.setEditCellValue({
                id: props.id,
                field: props.field,
                value: newValue,
            });
        }
    };

    if (isEditing && editable && getData) {
        return (
            <Box sx={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', px: 1}}>
                <FormControl fullWidth size="small">
                    <Select
                        autoFocus
                        value={dataValue ?? ''}
                        onChange={handleChange}
                        variant="outlined"
                        sx={{
                            fontSize: '14px',
                            height: '32px',
                            '& .MuiSelect-select': {py: '4px'},
                        }}
                    >
                        {list.map((item: any, idx: number) => (
                            <MenuItem key={idx} value={item[keyField]} sx={{fontSize: '14px'}}>
                                {item[text as string]}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
        );
    }

    const valueNameFromData = fieldName ? (dataItem[fieldName] || dataItem[fieldName.charAt(0).toUpperCase() + fieldName.slice(1)]) : null;
    const valueName = valueNameFromData || ((value && value[text as string]) || dataItem[fieldId as string] || dataItem[fieldId ? fieldId.charAt(0).toUpperCase() + fieldId.slice(1) : ''] || dataValue || '');

    if (onClick && !isEditing) {
        const valueId = fieldId
            ? (dataItem[fieldId] || dataItem[fieldId.charAt(0).toUpperCase() + fieldId.slice(1)])
            : (value ? value[keyField] : dataValue);

        return (
            <MuiLink
                component="button"
                variant="body2"
                onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onClick(valueId, context?.itemUpdate);
                }}
                sx={{
                    textDecoration: 'none',
                    textAlign: 'left',
                    fontSize: '14px',
                    color: 'primary.main',
                    '&:hover': {textDecoration: 'underline'},
                }}
            >
                {valueName}
            </MuiLink>
        );
    }

    return <span style={{fontSize: '14px'}}>{valueName}</span>;
};
