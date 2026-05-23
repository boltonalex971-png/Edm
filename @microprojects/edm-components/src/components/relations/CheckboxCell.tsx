import {Box, Checkbox} from '@mui/material';

interface CheckboxCellProps {
    onChange: (e: {dataItem: any; field: string; value: boolean}) => void;
    dataItem: any;
    field: string;
    inEdit?: boolean;
    editable?: boolean;
}

export const CheckboxCell = ({
    editable = true,
    ...props
}: CheckboxCellProps) => {
    const {dataItem, field, inEdit} = props;
    const value = !!dataItem[field];
    if (inEdit && editable) {
        return (
            <Checkbox
                size="small"
                checked={value}
                onChange={(e) =>
                    props.onChange({
                        dataItem,
                        field,
                        value: e.target.checked,
                    })
                }
            />
        );
    }
    return (
        <Box sx={{width: '100%', textAlign: 'center', color: 'var(--ink-2)'}}>
            {value ? '✓' : ''}
        </Box>
    );
};
