import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { ParentContext } from './ParentContext';
import { 
    Select,
    MenuItem, 
    TextField, 
    FormControl, 
    Link as MuiLink,
    Box
} from '@mui/material';

export const DropDownComp = (props) => {
    const { dataItemKey, value: propValue, data: propData, onChange, field, dataItem, textField } = props;
    const data = propData || [];

    const handleChange = (e) => {
        const val = e.target.value;
        onChange({
            dataItem: dataItem,
            field: field,
            value: dataItemKey ? (typeof val === 'object' ? val[dataItemKey] : val) : val
        });
    }

    const value = dataItemKey ?
        (data.find(c => c[dataItemKey] === propValue) || propValue || "") :
        (data.find(c => c === propValue) || propValue || "");

    return (
        <FormControl fullWidth size="small">
            <Select
                value={dataItemKey && typeof value === 'object' ? value[dataItemKey] : value}
                onChange={handleChange}
                variant="outlined"
                sx={{ fontSize: '14px' }}
            >
                {data.map((item, idx) => (
                    <MenuItem key={idx} value={dataItemKey ? item[dataItemKey] : item} sx={{ fontSize: '14px' }}>
                        {textField ? item[textField] : item}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}

DropDownComp.propTypes = {
    onChange: PropTypes.func,
    field: PropTypes.string,
    dataItem: PropTypes.object,
    dataItemKey: PropTypes.string,
    data: PropTypes.array,
    value: PropTypes.any,
    textField: PropTypes.string
}

export const DropDownCell = (props) => {
    const { getData, id, dataKey, text, fieldName, fieldId, onClick, editable = true, field, inEdit } = props;
    const dataItem = props.dataItem || props.row;
    const context = useContext(ParentContext);
    
    if (!dataItem) return null;
    
    const isEditing = inEdit || dataItem?.inEdit || dataItem?.isNew || (props.api?.getRowMode?.(props.id) === 'edit');
    const dataValue = props.value !== undefined ? props.value : (dataItem ? dataItem[field] : null);
    const list = (getData && getData()) || [];
    
    // Identifier field name in list items. 
    // If used in DataGrid (props.api present), props.id is the row ID, so we default to 'id'.
    // Otherwise we use the provided dataKey or fallback to the id prop.
    const keyField = dataKey || (props.api ? 'id' : id) || 'id';
    let value = list.find(c => c[keyField] === dataValue);

    const handleChange = (e) => {
        const val = e.target.value;
        // If the value is an object, try to extract the key, otherwise use the value directly
        const newValue = keyField && val && typeof val === 'object' 
            ? (val[keyField] !== undefined ? val[keyField] : val) 
            : val;
        
        if (props.onChange) {
            props.onChange({
                dataItem: dataItem,
                field: field,
                value: newValue
            });
        } else if (props.api && props.api.setEditCellValue) {
            props.api.setEditCellValue({
                id: props.id,
                field: props.field,
                value: newValue
            });
        }
    }

    if (isEditing && editable && getData) {
        return (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', px: 1 }}>
                <FormControl fullWidth size="small">
                    <Select
                        autoFocus
                        value={dataValue ?? ''}
                        onChange={handleChange}
                        variant="outlined"
                        sx={{ 
                            fontSize: '14px',
                            height: '32px',
                            '& .MuiSelect-select': { py: '4px' }
                        }}
                    >
                        {list.map((item, idx) => (
                            <MenuItem key={idx} value={item[keyField]} sx={{ fontSize: '14px' }}>
                                {item[text]}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
        );
    } 
    
    const valueNameFromData = fieldName ? (dataItem[fieldName] || dataItem[fieldName.charAt(0).toUpperCase() + fieldName.slice(1)]) : null;
    const valueName = valueNameFromData || ((value && value[text]) || dataItem[fieldId] || dataItem[fieldId?.charAt(0).toUpperCase() + fieldId?.slice(1)] || dataValue || '');

    if (onClick && !isEditing) {
        const valueId = fieldId ? (dataItem[fieldId] || dataItem[fieldId?.charAt(0).toUpperCase() + fieldId?.slice(1)]) : (value ? value[keyField] : dataValue);
        
        return (
            <MuiLink 
                component="button" 
                variant="body2" 
                onClick={(e) => { 
                    e.stopPropagation(); 
                    onClick(valueId, context?.itemUpdate); 
                }}
                sx={{ 
                    textDecoration: 'none', 
                    textAlign: 'left', 
                    fontSize: '14px',
                    color: 'primary.main',
                    '&:hover': { textDecoration: 'underline' }
                }}
            >
                {valueName}
            </MuiLink>
        );
    } 

    return <span style={{ fontSize: '14px' }}>{valueName}</span>;
}

DropDownCell.propTypes = {
    getData: PropTypes.func,
    onClick: PropTypes.func,
    dataItem: PropTypes.object,
    inEdit: PropTypes.bool,
    field: PropTypes.string,
    id: PropTypes.any,
    dataKey: PropTypes.string,
    text: PropTypes.string,
    fieldName: PropTypes.string,
    fieldId: PropTypes.string,
    editable: PropTypes.bool,
    value: PropTypes.any,
    onChange: PropTypes.func,
    api: PropTypes.any
}

export const LinkTextCell = (props) => {
    const { fieldId, onClick, template, editable = true, field, inEdit } = props;
    const dataItem = props.dataItem || props.row;
    const context = useContext(ParentContext)
    
    if (!dataItem) return null;

    const isEditing = inEdit || dataItem?.inEdit || dataItem?.isNew || (props.api?.getRowMode?.(props.id) === 'edit');
    const value = template !== undefined ? template : (props.value !== undefined ? props.value : (dataItem ? dataItem[field] : null));

    const handleChange = (e) => {
        const newValue = e.target.value;
        if (props.onChange) {
            props.onChange({
                dataItem: dataItem,
                field: field,
                value: newValue
            });
        } else if (props.api && props.api.setEditCellValue) {
            props.api.setEditCellValue({
                id: props.id,
                field: props.field,
                value: newValue
            });
        }
    }

    if (isEditing && editable) {
        return (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', px: 0.5 }}>
                <TextField
                    autoFocus
                    fullWidth
                    size="small"
                    value={value ?? ''}
                    onChange={handleChange}
                    variant="outlined"
                    sx={{
                        '& .MuiInputBase-root': {
                            height: '32px',
                            fontSize: '14px',
                        },
                        '& .MuiOutlinedInput-input': {
                            py: '4px',
                            px: '8px'
                        }
                    }}
                />
            </Box>
        );
    } 

    const id = dataItem ? dataItem[fieldId || "id"] : props.id;
    
    if (onClick && !isEditing) {
        return (
            <MuiLink 
                component="button" 
                variant="body2" 
                onClick={(e) => { 
                    e.stopPropagation(); 
                    onClick(id, context.itemUpdate); 
                }}
                sx={{ 
                    textDecoration: 'none', 
                    textAlign: 'left', 
                    fontSize: '14px',
                    color: 'primary.main',
                    '&:hover': { textDecoration: 'underline' }
                }}
            >
                {value}
            </MuiLink>
        );
    }

    return <span style={{ fontSize: '14px' }}>{value}</span>;
}

LinkTextCell.propTypes = {
    onClick: PropTypes.func,
    dataItem: PropTypes.object,
    inEdit: PropTypes.bool,
    field: PropTypes.string,
    fieldId: PropTypes.string,
    editable: PropTypes.bool,
    template: PropTypes.any,
    value: PropTypes.any,
    id: PropTypes.any,
    onChange: PropTypes.func,
    api: PropTypes.any
}
