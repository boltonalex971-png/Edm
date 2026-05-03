export type Any =
    | bigint
    | boolean
    | number
    | string
    | []
    | object
    | null
    | undefined
export type UUID = `${string}-${string}-${string}-${string}-${string}`

export interface Dictionary {
    [key: string]: Any
}

export interface DataItem {
    id: UUID
    name: string
    description?: string
    isActive: boolean
}

export interface TreeDataItem extends DataItem {
    directoryId: number
    isFolder: boolean
    items: TreeDataItem[]
    expanded: boolean
    groups?: string[] | null
    /** Set when the entity has been superseded by an auto-fork. UI shows
     * a read-only "outdated" indicator and blocks edits. */
    outdated?: boolean
}

export interface TreeNode extends TreeDataItem {
    isFolder: true
}

export interface Process extends DataItem {
    message: string
    kind: ProcessKind
    nomenclatureName?: string
    nomenclatureId?: number
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

export interface NomenclatureTareType {
    id: UUID
    nomenclatureId: UUID
    tareTypeId: UUID
    tareTypeName?: string
    tareTypeDescription?: string
    nomenclatureName?: string
    nomenclatureDescription?: string
    nomenclatureCategory?: string
    isDefault: boolean
}

export interface Item extends DataItem {
    id: UUID
    supplyId?: UUID
    supplyName?: string
    orderId?: UUID
    orderName?: string
    orderNumber?: string
    processId?: UUID
    processName?: string
    /** True when this item is an order execution output (ProcessId != null). */
    isOutput?: boolean
    /** True when the item has no recorded origin: no supply, no producing process,
     * and no parent ItemLink — i.e. created directly via batch entry from store. */
    isStore?: boolean
    /** Soft-deleted or naturally completed (e.g. consumed by an order execution).
     * Historical rows surface in component / spec views with this flag set so
     * they can be rendered greyed. */
    inactive?: boolean
    /** Process grade assigned to this output item, nullable. */
    gradeId?: UUID
    gradeName?: string
    nomenclatureName: string
    nomenclatureId: UUID
    nomenclatureCountable?: boolean
    /** Units label sourced from the nomenclature's default tare type. */
    nomenclatureUnits?: string
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
    quantity: number
}

export interface Supply extends DataItem {
    id: UUID
    barcode?: string
    shipment?: string
    shipmentExternalId?: string
    metaCreated?: string
}

export interface ItemNode {
    id: UUID
    serialNo?: string
    quantity: number
    nomenclatureId?: UUID
    nomenclatureName?: string
    nomenclatureCategory?: string
    nomenclatureCountable?: boolean
    /** True when this item is an order execution output (ProcessId != null). */
    isOutput?: boolean
    tareId?: UUID
    tareBarcode?: string
    tareTypeName?: string
    tareTypeUnits?: string
    address?: number
    orderId?: UUID
    /** Signed distance from the root. <0 = ancestor, 0 = root, >0 = descendant. */
    depth: number
    /** Soft-deleted or completed — render greyed. */
    inactive: boolean
    /** True when there are more links beyond this node beyond the depth cap. */
    hasMore: boolean
}

export interface GenealogyEdge {
    sourceItemId: UUID
    targetItemId: UUID
    consumedQuantity: number
    /** Null for non-execution edges (repack bulk split, allocation split). */
    orderProcessId?: UUID
    processName?: string
}

export interface ItemGenealogy {
    rootId: UUID
    nodes: ItemNode[]
    edges: GenealogyEdge[]
    truncated: boolean
    depth: number
}

export interface ItemSearchQuery {
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

export interface AvailableTare extends TareInfo {
    remaining: number
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
    movedQuantity: number
    units?: string
    countable: boolean
    errors: string[]
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
    quantity: number
    units?: string
    countable: boolean
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
    units?: string
    countable: boolean
    stoppedReason?: string
}

export interface OrderSearchQuery {
    nomenclatureId?: UUID
    active?: boolean
}

export interface ExecuteResult {
    completed: boolean
    pendingCount: number
}

export interface OrderOutputItems {
    /** Root process of the order — used by UI to load applicable grades. */
    processId?: UUID
    allocated: Item[]
    unallocated: Item[]
}

export interface AssignGradesRequest {
    /** null to clear the grade on selected items. */
    gradeId?: UUID
    itemIds: UUID[]
}

export interface AssignGradesResult {
    updatedCount: number
    errors: string[]
}

export interface OutputAllocation {
    itemId: UUID
    tareId: UUID
    address?: number
}

export interface AllocateOutputsRequest {
    allocations: OutputAllocation[]
}

export interface AllocateOutputsResult {
    allocatedCount: number
    errors: string[]
}

export type OrderStatus = 'Draft' | 'Running' | 'OutputsPending' | 'Completed'

export interface OrderSpecification {
    id: UUID
    nomenclatureId: UUID
    nomenclatureCategory?: string
    nomenclatureName?: string
    nomenclatureDescription?: string
    processName?: string
    processId: UUID
    amount: number
    total: number
}

export interface Order extends DataItem {
    number: string
    processId: UUID
    processName: string
    processNomenclatureId: UUID
    processNomenclatureName: string
    processNomenclatureUnits?: string
    processNomenclatureCountable: boolean
    amount: number
    startDate: Date
    dueDate: Date
    completed?: string
    deleted?: string
    /** Derived lifecycle state of the order's root process. */
    status?: OrderStatus
    /** User who launched the process and owns the order until completion. Null when unlaunched. */
    executor?: string
    /** True when the current user is the Executor. */
    mine?: boolean
}

export interface OrderProcess {
    id: UUID
    orderId: UUID
    startTime?: string
    endTime?: string
    processId?: UUID
    processName?: string
    processKind?: string
    processNomenclatureId?: UUID
    processNomenclatureName?: string
}

export interface Operation extends DataItem {}

export interface User extends DataItem {
    roles: string[]
    role: string
    claims: string[]
    groups: string[]
}

export type DetailEventHandler = (data?: TreeNode) => void

export type ProcessKind = 'Manufacturing' | 'Technology' | 'Operation'
