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
    taretype: string
}

export interface TareType extends DataItem {
    unit: string
    countable: boolean
    dimensions: number
    capacity: number
}

export interface Item {
    id: UUID
    nomenclatureName: string
    children: Item[]
    tareBarcode: string
    tareTypeName: string
    tareTypeUnits: string
    capacity: number
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
