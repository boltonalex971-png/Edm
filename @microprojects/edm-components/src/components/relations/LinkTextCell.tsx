import React, {useContext} from 'react';
import {TextField, Link as MuiLink, Box} from '@mui/material';
import {ParentContext} from '../master/ParentContext';

// DataGrid cell renderer with three modes:
// - edit: outlined TextField (matches the v2 default-edit-cell chrome)
// - link: MUI Link calling onClick(rowId, parentItemUpdate) when clicked
// - plain text fallback
//
// `template` overrides the displayed text without changing the data field.

export interface LinkTextCellProps {
    onClick?: (id: any, itemUpdate?: () => void) => void;
    dataItem?: any;
    row?: any;
    inEdit?: boolean;
    field?: string;
    fieldId?: string;
    editable?: boolean;
    template?: any;
    value?: any;
    id?: any;
    onChange?: (e: {dataItem: any; field?: string; value: any}) => void;
    api?: any;
}

export const LinkTextCell = (props: LinkTextCellProps) => {
    const {fieldId, onClick, template, editable = true, field, inEdit} = props;
    const dataItem = props.dataItem || props.row;
    const context = useContext(ParentContext);

    if (!dataItem) return null;

    const isEditing = inEdit || dataItem?.inEdit || dataItem?.isNew || (props.api?.getRowMode?.(props.id) === 'edit');
    const value = template !== undefined
        ? template
        : (props.value !== undefined ? props.value : (dataItem ? dataItem[field as string] : null));

    const handleChange = (e: any) => {
        const newValue = e.target.value;
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

    if (isEditing && editable) {
        return (
            <Box sx={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', px: 0.5}}>
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
                            px: '8px',
                        },
                    }}
                />
            </Box>
        );
    }

    const id = dataItem ? dataItem[fieldId || 'id'] : props.id;

    if (onClick && !isEditing) {
        return (
            <MuiLink
                component="button"
                variant="body2"
                onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onClick(id, context.itemUpdate);
                }}
                sx={{
                    textDecoration: 'none',
                    textAlign: 'left',
                    fontSize: '14px',
                    color: 'primary.main',
                    '&:hover': {textDecoration: 'underline'},
                }}
            >
                {value}
            </MuiLink>
        );
    }

    return <span style={{fontSize: '14px'}}>{value}</span>;
};
