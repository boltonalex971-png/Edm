import {
    AccountTreeOutlined as ManufacturingIcon,
    AllInboxOutlined as TareTypeIcon,
    CategoryOutlined as NomenclatureIcon,
    Inventory2Outlined as ItemIcon,
    ListAltOutlined as OrderIcon,
    LocalShippingOutlined as SupplyIcon,
    PlayArrowOutlined as OperationIcon,
    PrecisionManufacturingOutlined as TechnologyIcon,
    WidgetsOutlined as TareIcon,
} from '@mui/icons-material'

// URL prefix → entity type for Logistics. The entity type name must match
// a corresponding `--ent-{name}-deep` token in logistics-entities.css.
export const LOGISTICS_ENTITY_TYPE_MAP = [
    { urlPrefix: '/nomenclatures', entityType: 'nomenclature' },
    { urlPrefix: '/taretypes',     entityType: 'taretype' },
    { urlPrefix: '/processes',     entityType: 'process' },
    { urlPrefix: '/orders',        entityType: 'order' },
    { urlPrefix: '/items',         entityType: 'item' },
    { urlPrefix: '/supplies',      entityType: 'supply' },
    { urlPrefix: '/tares',         entityType: 'tare' },
]

export const LOGISTICS_ICON_MAP = {
    nomenclature:  NomenclatureIcon,
    taretype:      TareTypeIcon,
    process:       ManufacturingIcon,
    manufacturing: ManufacturingIcon,
    technology:    TechnologyIcon,
    operation:     OperationIcon,
    order:         OrderIcon,
    item:          ItemIcon,
    supply:        SupplyIcon,
    tare:          TareIcon,
}
