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
    groups?: string[] | null
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
    sizeX?: number
    sizeY?: number
    sizeZ?: number
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
    tareId?: UUID
    tareBarcode?: string
    tareTareTypeId?: UUID
    tareTareTypeName?: string
    tareTareTypeUnits?: string
    tareTareTypeSizeX?: number
    tareTareTypeSizeY?: number
    tareTareTypeSizeZ?: number
    tareTareTypeDimensions: number
    tareTareTypeCapacity: number
    address?: number
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

export interface TareInfo {
    id: UUID
    barcode?: string
    tareTypeId: UUID
    tareTypeName?: string
    tareTypeUnits?: string
    sizeX?: number
    sizeY?: number
    sizeZ?: number
    dimensions: number
    capacity: number
}

export interface RepackMove {
    sourceItemId: UUID
    targetTareId: UUID
    targetAddress?: number
    quantity: number
}

export interface RepackRequest {
    nomenclatureId: UUID
    moves: RepackMove[]
}

export interface RepackResult {
    movedCount: number
    errors: string[]
}

export interface AvailableTare {
    id: UUID
    barcode?: string
    tareTypeId: UUID
    tareTypeName?: string
    tareTypeUnits?: string
    sizeX?: number
    sizeY?: number
    sizeZ?: number
    dimensions: number
    capacity: number
    remaining: number
}

export interface BatchCreateItemRequest {
    nomenclatureId: UUID
    tareTypeId: UUID
    tareId?: UUID
    barcode?: string
    quantity: number
    supplyId?: UUID
}

export interface BatchCreateItemResult {
    createdCount: number
    tareId: UUID
    tareBarcode?: string
    tareTypeName?: string
    remaining: number
    items: Item[]
}

export interface AllocateItemsRequest {
    itemIds: UUID[]
}

export interface AllocateItemsResult {
    allocatedCount: number
    allocatedQuantity: number
    stoppedReason?: string
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
