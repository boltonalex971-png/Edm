import {Box, Link} from '@mui/material';
import {useContext} from 'react';
import {HierarchyPicker, type HierarchyNode} from '../forms/HierarchyPicker';
import {ParentContext} from '../master/ParentContext';

interface DropDownTreeCellProps {
    getData: () => HierarchyNode[] | undefined;
    onClick?: (id: string, itemUpdate: (item?: any) => void) => void;
    onChange: (e: {dataItem: any; field: string; value: string}) => void;
    dataItem: any;
    field: string;
    fieldId: string;
    fieldName?: string;
    inEdit?: boolean;
    editable?: boolean;
}

function findById(
    nodes: HierarchyNode[] | undefined,
    id: string | undefined,
): HierarchyNode | null {
    if (!nodes || !id) return null;
    for (const n of nodes) {
        if (n.id === id) return n;
        const child = findById(n.items, id);
        if (child) return child;
    }
    return null;
}

export const DropDownTreeCell = ({
    getData,
    fieldId,
    fieldName,
    onClick,
    editable = true,
    ...props
}: DropDownTreeCellProps) => {
    const context = useContext(ParentContext);
    const {dataItem, field, inEdit} = props;
    const tree = getData();
    const currentId = dataItem[fieldId] as string | undefined;
    const selected = findById(tree, currentId);

    if (inEdit && editable) {
        return (
            <HierarchyPicker
                data={tree}
                value={currentId}
                onChange={(id) =>
                    props.onChange({dataItem, field, value: id as string})
                }
            />
        );
    }
    const valueName = (fieldName && dataItem[fieldName]) || selected?.name;
    if (onClick && currentId) {
        return (
            <Link
                component="button"
                underline="hover"
                onClick={() => onClick(currentId, context.itemUpdate)}
                sx={{color: 'var(--accent)', cursor: 'pointer', font: 'inherit'}}
            >
                {valueName}
            </Link>
        );
    }
    return (
        <Box sx={{whiteSpace: 'nowrap', color: 'var(--ink-2)'}}>{valueName}</Box>
    );
};
