import React from 'react';
import {Select, MenuItem, FormControl} from '@mui/material';

// Headless dropdown form-control wrapper. Used both as a standalone select
// and as a building block for `DropDownCell`'s edit mode. `dataItemKey` /
// `textField` let it bind to either an array of objects (with key/label
// fields) or an array of plain values.

export interface DropDownCompProps {
    onChange?: (e: {dataItem: any; field?: string; value: any}) => void;
    field?: string;
    dataItem?: any;
    dataItemKey?: string;
    data?: any[];
    value?: any;
    textField?: string;
}

export const DropDownComp = (props: DropDownCompProps) => {
    const {dataItemKey, value: propValue, data: propData, onChange, field, dataItem, textField} = props;
    const data = propData || [];

    const handleChange = (e: any) => {
        const val = e.target.value;
        onChange && onChange({
            dataItem,
            field,
            value: dataItemKey ? (typeof val === 'object' ? val[dataItemKey] : val) : val,
        });
    };

    const value = dataItemKey
        ? (data.find((c: any) => c[dataItemKey] === propValue) || propValue || '')
        : (data.find((c: any) => c === propValue) || propValue || '');

    return (
        <FormControl fullWidth size="small">
            <Select
                value={dataItemKey && typeof value === 'object' ? value[dataItemKey] : value}
                onChange={handleChange}
                variant="outlined"
                sx={{fontSize: '14px'}}
            >
                {data.map((item: any, idx: number) => (
                    <MenuItem key={idx} value={dataItemKey ? item[dataItemKey] : item} sx={{fontSize: '14px'}}>
                        {textField ? item[textField] : item}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};
