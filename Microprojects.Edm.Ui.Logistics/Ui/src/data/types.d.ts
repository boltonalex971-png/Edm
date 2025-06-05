export type Any = bigint | boolean | number | string | [] | object | null | undefined
export type UUID = `${string}-${string}-${string}-${string}-${string}`

export interface Dictionary {
    [key: string]: Any
}

export interface DataItem {
    id: UUID
    name: string
    description?: string,
    isActive: boolean
}

export interface TreeDataItem extends DataItem {
    directoryId: number
    isFolder: boolean
    items: TreeDataItem[]
    expanded: boolean
}

export interface TreeNode extends TreeDataItem {
    isFolder: true
}

export interface Process extends DataItem {
    message: string
    kind: string,
    nomenclatureName?: string,
    nomenclatureId?: number,
}

export interface Nomenclature extends DataItem {
    category: string
    defaultTareTypeId: UUID
    defaultTareTypeName?: string
}

export interface TareType extends DataItem {
    units: string
    countable: boolean
    dimensions: number
    capacity: number
}

export interface Item  extends DataItem {
    id: UUID
    originId: UUID
    nomenclatureName: string
    nomenclatureId: UUID
    children: Item[]
    tareBarcode: string
    tareTareTypeId: UUID
    tareTareTypeName: string
    tareTareTypeUnits: string
    capacity: number
    quantity:  number
}

export interface ItemSearchQuery {
    originId?: UUID
    nomenclatureId?: UUID
    active?: boolean
}

export interface OrderSearchQuery {
    nomenclatureId?: UUID
    active?: boolean
}

export interface Order extends DataItem {
    processId: UUID
    processName: string
    processNomenclatureId: UUID
    processNomenclatureName: string
    amount: number
    startDate: Date
    dueDate: Date
}

export interface Operation extends DataItem {
}

export interface User extends DataItem {
    roles: string[]
    role: string
    claims: string[]
    divisions: string[]
}

export type DetailEventHandler = (data?: TreeNode) => void;

export type ProcessKind = {
    name: string
    id: string
}
