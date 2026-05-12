import React from 'react';

// Column descriptor for RelationTable. The component itself never
// renders — RelationTable's parseChildrenToColumns walks its children and
// reads only their props, so this is a typed config holder. Lets callers
// drop the @progress/kendo-react-grid `GridColumn` import that was
// previously serving the same purpose.
export interface ColumnProps {
    /** Field name on the row. Required for plain (non-custom) columns; for
     *  custom-cell columns leave undefined and RelationTable will assign a
     *  synthetic field name. */
    field?: string;
    /** Header label. */
    title?: string;
    /** Numeric pixel width, "auto" / non-numeric for flex sizing. */
    width?: number | string;
    /** Plain columns are editable by default; pass `false` to lock the column.
     *  Custom-cell columns are always treated as editable so the cell's own
     *  edit branch can fire. */
    editable?: boolean;
    /** Custom cell renderer — receives MUI X DataGrid cell params plus
     *  `dataItem`/`onChange`/`inEdit` shims for legacy cell components. */
    cell?: React.ComponentType<any>;
}

export const Column: React.FC<ColumnProps> = () => null;
