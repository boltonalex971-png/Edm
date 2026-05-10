// Logistics's HierarchyPicker lives in @microprojects/edm-components since
// Phase 2. This file is a re-export shim so existing call sites keep working
// during Phase 3b/3c without churning every importer.
//
// The package version is an MUI port (TextField + Popper + SimpleTreeView)
// of the original Kendo DropDownTree-backed picker. UX matches: canvas-
// measured input min-width, popup pinned to input width on open, folders
// non-selectable + bold, leaves clickable. Helpers (findInHierarchy,
// pruneHierarchy, dropOutdated) are generic so Logistics's richer
// TreeDataItem shape passes through without losing fields.

export {
    HierarchyPicker,
    findInHierarchy,
    pruneHierarchy,
    dropOutdated,
    type HierarchyNode,
    type HierarchyPickerProps,
} from '@microprojects/edm-components/components/forms/HierarchyPicker';
