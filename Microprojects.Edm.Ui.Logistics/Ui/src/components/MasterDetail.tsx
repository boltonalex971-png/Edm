import {
    EMPTY_GUID,
    MasterDetail as PkgMasterDetail,
    Detail as PkgDetail,
    type DetailProps as PkgDetailProps,
} from '@microprojects/edm-components/components/master/MasterDetail'
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
import type React from 'react'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import api from '../features/api/api'
import type { RootState } from '../store'
import { useEntityToken } from '@microprojects/edm-components/hooks'
import { Folder } from './config/Folder'

// URL prefix → entity type for Logistics. The entity type name must match
// a corresponding `--ent-{name}-deep` token in logistics-entities.css.
const LOGISTICS_ENTITY_TYPE_MAP = [
    { urlPrefix: '/nomenclatures', entityType: 'nomenclature' },
    { urlPrefix: '/taretypes',     entityType: 'taretype' },
    { urlPrefix: '/processes',     entityType: 'process' },
    { urlPrefix: '/orders',        entityType: 'order' },
    { urlPrefix: '/items',         entityType: 'item' },
    { urlPrefix: '/supplies',      entityType: 'supply' },
    { urlPrefix: '/tares',         entityType: 'tare' },
]

const LOGISTICS_ICON_MAP = {
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

export type MasterDetailProps = {
    api: string
    getHierarchyQuery?: () => Record<string, string | undefined>
    stubMessage: string
    type: string
    detail: React.ReactElement
    path: string
    entityType?: string
}

export function MasterDetail(props: MasterDetailProps) {
    const treeToken = useEntityToken([{ type: props.type }])

    // Package's MasterDetail derives entityType from URL by default; Logistics
    // wants to use the master's `type` prop directly so Folder consistently
    // targets the right typed-hierarchy bucket.
    const FolderForType = useCallback(
        (folderProps: { api?: string; path: string; onChange: () => void; onClose: () => void }) => (
            <Folder
                api={folderProps.api ?? api.directories}
                path={folderProps.path}
                type={props.type}
                onChange={folderProps.onChange}
                onClose={folderProps.onClose}
            />
        ),
        [props.type],
    )

    return (
        <PkgMasterDetail
            api={props.api}
            hierarchiesApi={api.directories}
            folderComponent={FolderForType}
            detail={props.detail}
            path={props.path}
            stubMessage={props.stubMessage}
            refreshToken={treeToken}
            getHierarchyQuery={props.getHierarchyQuery}
            entityTypeMap={LOGISTICS_ENTITY_TYPE_MAP}
            iconMap={LOGISTICS_ICON_MAP}
            entityType={props.entityType}
            newId={EMPTY_GUID}
            unwrapSingleRoot
        />
    )
}

// Logistics's Detail prop shape. Mirrors the package's `DetailProps` with
// Logistics-specific tightenings (UUID id, required onClose, DataItem). The
// implementation below is a thin wrapper that injects `username` from Redux
// and forwards everything else to the package's enriched Detail.
export type DetailProps = Omit<PkgDetailProps, 'username'>

export function Detail({ editable = true, copyable = true, deletable = true, readonly = false, ...props }: DetailProps) {
    const username = useSelector((s: RootState) => s.user.name)
    return (
        <PkgDetail
            {...(props as PkgDetailProps)}
            editable={editable}
            copyable={copyable}
            deletable={deletable}
            readonly={readonly}
            username={username}
        />
    )
}
