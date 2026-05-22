// Wraps the package RelationTable to default the new-row sentinel id to the
// empty Guid (Logistics ids are Guid-typed; the package default of `0` would
// fail model binding on POST). Callers can still override `newId` per-table.

import {
    RelationTable as PkgRelationTable,
    type RelationTableProps,
} from '@microprojects/edm-components/components/relations/RelationTable'
import { EMPTY_GUID } from '@microprojects/edm-components/components/master/MasterDetail'

export function RelationTable({ newId = EMPTY_GUID, ...rest }: RelationTableProps) {
    return <PkgRelationTable newId={newId} {...rest} />
}
