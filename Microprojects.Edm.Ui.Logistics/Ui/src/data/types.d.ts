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
    kind: ProcessKind,
    nomenclatureName?: string,
    nomenclatureId?: number,
}

export interface Grade extends DataItem {
    processId: UUID
    description?: string
    qualifierName?: string
}

export interface Nomenclature extends DataItem {
    category: string
    countable: boolean
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
    supplyId?: UUID
    nomenclatureName: string
    nomenclatureId: UUID
    children: Item[]
    serialNo?: string
    tareBarcode?: string
    tareTareTypeId?: UUID
    tareTareTypeName?: string
    tareTareTypeUnits?: string
    address?: number
    capacity: number
    quantity:  number
}

export interface Supply extends DataItem {
    id: UUID
    barcode?: string
    shipment?: string
    shipmentExternalId?: string
    metaCreated?: string
}

export interface ItemLinkRow {
    id: UUID
    orderProcessId: UUID

    sourceItemId: UUID
    sourceSerialNo?: string
    sourceNomenclatureName?: string
    sourceTareBarcode?: string
    sourceTareTypeName?: string
    sourceTareTypeUnits?: string
    sourceAddress?: number

    targetItemId: UUID
    targetNomenclatureName?: string
    targetTareBarcode?: string
    targetAddress?: number

    consumedQuantity: number
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
    groups: string[]
}

export type DetailEventHandler = (data?: TreeNode) => void;

export type ProcessKind = 'Manufacturing' | 'Technology' | 'Operation'
