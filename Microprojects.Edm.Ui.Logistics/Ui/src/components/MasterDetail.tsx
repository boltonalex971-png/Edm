import { useAlertSetter } from '@logistics/hooks/useAlertSetter'
import {
    DetailEditModeContext,
    EMPTY_GUID,
    Detail as PkgDetail,
    type DetailProps as PkgDetailProps,
    MasterDetail as PkgMasterDetail,
} from '@microprojects/edm-components/components/master/MasterDetail'
import { useDialog } from '@microprojects/edm-components/hooks/useDialog'
import {
    AccountTreeOutlined as ManufacturingIcon,
    AllInboxOutlined as TareTypeIcon,
    CategoryOutlined as NomenclatureIcon,
    Inventory2Outlined as ItemIcon,
    ListAltOutlined as OrderIcon,
    LocalShippingOutlined as SupplyIcon,
    PlayArrowOutlined as OperationIcon,
    PrecisionManufacturingOutlined as TechnologyIcon,
    SaveOutlined as SaveIcon,
    WidgetsOutlined as TareIcon,
} from '@mui/icons-material'
import { Box, Button as MuiButton } from '@mui/material'
import axios from 'axios'
import type React from 'react'
import {
    type MouseEventHandler,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react'
import {useTranslation} from 'react-i18next'
import {useSelector} from 'react-redux'
import {useLocation, useNavigate} from 'react-router-dom'
import {resolveError} from '@logistics/i18n/resolveError'
import type {
    DataItem,
    DetailEventHandler,
    Dictionary,
    TreeDataItem,
    UUID,
} from '../data/types'
import api from '../features/api/api'
import type {RootState} from '../store'
import {
    listTag,
    useEntityToken,
    useInvalidateEntities,
} from '@microprojects/edm-components/hooks'
import {Folder} from './config/Folder'

// Re-export the package's context + sentinel so Logistics call sites that
// import them from this file (legacy paths) keep working without churn.
export {DetailEditModeContext, EMPTY_GUID}

// Per-instance so it resets across kind navigations; module-level would drop new items into the previous view's folder when the new list is empty.
const RootItemContext = createContext<TreeDataItem | undefined>(undefined)

// URL prefix → entity type for Logistics. The entity type name must match a corresponding `--ent-{name}-deep` token in logistics-entities.css.
const LOGISTICS_ENTITY_TYPE_MAP = [
    {urlPrefix: '/nomenclatures', entityType: 'nomenclature'},
    {urlPrefix: '/taretypes',     entityType: 'taretype'},
    {urlPrefix: '/processes',     entityType: 'process'},
    {urlPrefix: '/orders',        entityType: 'order'},
    {urlPrefix: '/items',         entityType: 'item'},
    {urlPrefix: '/supplies',      entityType: 'supply'},
    {urlPrefix: '/tares',         entityType: 'tare'},
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
    const treeToken = useEntityToken([{type: props.type}])
    const [rootItem, setRootItem] = useState<TreeDataItem | undefined>(undefined)

    // The package's MasterDetail passes `entityType` (capitalized, derived
    // from the API URL) into FolderComponent. Logistics's `Folder` uses the
    // lowercase Logistics-specific `type` for entity-token invalidation and
    // expects it via prop, so wrap with a closure that injects MasterDetail's
    // `type` directly. This bypasses the package's URL-prefix detection — fine,
    // because Logistics's URL prefixes don't always match the entity type.
    const FolderForType = useCallback(
        (folderProps: {api?: string; path: string; onChange: () => void; onClose: () => void}) => (
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
        <RootItemContext.Provider value={rootItem}>
            <PkgMasterDetail
                api={props.api}
                hierarchiesApi={api.directories}
                folderComponent={FolderForType}
                detail={props.detail}
                path={props.path}
                stubMessage={props.stubMessage}
                refreshToken={treeToken}
                onRootLoaded={setRootItem}
                getHierarchyQuery={props.getHierarchyQuery}
                entityTypeMap={LOGISTICS_ENTITY_TYPE_MAP}
                iconMap={LOGISTICS_ICON_MAP}
                entityType={props.entityType}
                newId={EMPTY_GUID}
                unwrapSingleRoot
            />
        </RootItemContext.Provider>
    )
}

// Logistics's Detail prop shape. Mirrors the package's `DetailProps` with
// Logistics-specific tightenings (UUID id, required onClose, DataItem). The
// implementation below is a thin wrapper that injects `username` from Redux
// and forwards everything else to the package's enriched Detail. All five
// behaviors that used to live here (lock UI, outdated banner, fork-required
// confirm, DetailEditModeContext, foreign-data flatten) now come from the
// package since 0.4.1.
export type DetailProps = {
    card?: React.ReactNode
    icon?: React.ReactElement
    editor?: React.ReactNode
    relations?: React.ReactNode
    subDetail?: React.ReactElement
    id?: UUID
    loading?: boolean
    error?: string
    validation?: string
    data?: DataItem
    onChange?: DetailEventHandler
    onClose: MouseEventHandler
    onUp?: MouseEventHandler
    path?: string
    api: string
    type?: string
    editMode?: boolean
    editable?: boolean
    copyable?: boolean
    deletable?: boolean
    readonly?: boolean
    title?: string
    subTitle?: string
    entityType?: string
    /** Auto-injected by the shared Detail when this component is rendered in
     * the `subDetail` slot — drives the breadcrumb parent chain. */
    parents?: any
}

export function Detail({editable = true, copyable = true, deletable = true, readonly = false, ...props}: DetailProps) {
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

type InfoProps = {
    content: React.ReactNode | ((formRenderProps: any) => React.ReactNode)
}

export function Info(props: InfoProps) {
    return (
        <>
            {typeof props.content === 'function'
                ? props.content(undefined)
                : props.content}
        </>
    )
}

// v2 editor: useState + content-as-function pattern with `{values, handleChange}`. Logistics-specific POST/PUT (UUID parents via RootItemContext, `directoryId` POST field, fork-required PUT handling).
interface MuiEditorProps {
    data: DataItem
    setData: DetailEventHandler
    type: string
    onUpdate?: DetailEventHandler
    onChange?: DetailEventHandler
    api: string
    path?: string
    content:
        | React.ReactNode
        | ((args: {
              values: Dictionary
              handleChange: (e: {target: {name: string; value: unknown}}) => void
              setValues: (next: Dictionary | ((prev: Dictionary) => Dictionary)) => void
          }) => React.ReactNode)
}

export function MuiEditor(props: MuiEditorProps) {
    const navigate = useNavigate()
    const location = useLocation()
    const setAlert = useAlertSetter()
    const { dialog, confirm } = useDialog()
    const setDetailEditMode = useContext(DetailEditModeContext)
    const rootItem = useContext(RootItemContext)
    const invalidate = useInvalidateEntities()
    const { t } = useTranslation('common')
    const [values, setValues] = useState<Dictionary>(props.data as Dictionary)

    // Sync the form values from props.data once it actually loads — `useState`
    // captures props.data on first render, which for new items happens before
    // the GET on `/{empty-guid}` returns the backend-supplied defaults
    // (notably the auto-incremented Order #). Re-sync whenever the record id
    // changes so navigating between list rows refills the form too. Edits are
    // safe: the user's record id is unchanged while they type, so this never
    // overwrites their input.
    const lastSyncedIdRef = useRef<unknown>(undefined)
    useEffect(() => {
        if (!props.data || props.data.id === undefined) return
        if (lastSyncedIdRef.current === props.data.id) return
        lastSyncedIdRef.current = props.data.id
        setValues(props.data as Dictionary)
    }, [props.data])

    const mode =
        (props.data.id && props.data.id !== EMPTY_GUID && 'Update') || 'Create'

    const handleChange = (e: {target: {name: string; value: unknown}}) => {
        setValues((prev) => ({...prev, [e.target.name]: e.target.value}))
    }

    const submit = (e?: React.FormEvent) => {
        e?.preventDefault()
        setAlert(undefined)
        const data = values
        const foreignData = Object.keys(data).reduce<Dictionary>(
            (r, d) => ({
                ...r,
                [d]:
                    data[d] &&
                    typeof data[d] === 'object' &&
                    !(data[d] instanceof Date) &&
                    !Array.isArray(data[d])
                        ? (data[d] as any).id
                        : data[d],
            }),
            {},
        )
        if (data.id && data.id !== EMPTY_GUID) {
            const sendUpdate = (force: boolean): Promise<unknown> => {
                const url = force
                    ? `${props.api}/${props.data.id}?force=true`
                    : `${props.api}/${props.data.id}`
                return axios
                    .put(url, foreignData)
                    .then((response) => {
                        props.onUpdate?.(response.data)
                        props.onChange?.(response.data)
                        props.setData(response.data)
                        invalidate([
                            {type: props.type},
                            {type: props.type, id: response.data.id},
                        ])
                        setAlert({
                            message: force
                                ? 'Saved as a new version'
                                : 'Updated successfully',
                        })
                        setDetailEditMode?.(false)
                        if (force && props.path) {
                            navigate(`${props.path}/${response.data.id}`)
                        }
                    })
                    .catch((r) => {
                        if (
                            !force &&
                            r.response?.status === 409 &&
                            r.response?.data?.code === 'fork-required'
                        ) {
                            const detail =
                                r.response?.data?.detail ||
                                'This change will create a new version.'
                            confirm({
                                title: 'Create new version?',
                                message: detail,
                                actionLabel: 'Create version',
                                onConfirm: () => {
                                    sendUpdate(true)
                                },
                            })
                            return
                        }
                        setAlert({
                            status: 'danger',
                            message: resolveError(r, t('error')),
                        })
                    })
            }
            sendUpdate(false)
        } else {
            const stateParentId = (location.state as any)?.parentId as
                | UUID
                | undefined
            const parentId = stateParentId || rootItem?.id
            axios
                .post(`${props.api}`, {...foreignData, directoryId: parentId})
                .then((response) => {
                    props.onUpdate?.(response.data)
                    props.onChange?.(response.data)
                    props.setData(response.data)
                    invalidate([
                        {type: props.type},
                        {type: props.type, id: response.data.id},
                        listTag(props.type),
                    ])
                    setAlert({message: 'Created successfully'})
                    setDetailEditMode?.(false)
                    if (props.path) {
                        navigate(
                            `${props.path}${response.data.isFolder ? '/folder' : ''}/${response.data.id}`,
                        )
                    }
                })
                .catch((r) =>
                    setAlert({
                        status: 'danger',
                        message: resolveError(r, t('error')),
                    }),
                )
        }
    }

    const content =
        typeof props.content === 'function'
            ? props.content({values, handleChange, setValues})
            : props.content

    return (
        <Box component="form" onSubmit={submit} noValidate>
            {dialog}
            <Box>{content}</Box>
            <Box
                sx={{
                    position: 'sticky',
                    bottom: 10,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 1,
                    py: 1,
                    background: 'var(--surface)',
                    borderTop: '1px solid var(--line)',
                    mt: 2,
                }}
            >
                <MuiButton
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                >
                    {mode}
                </MuiButton>
            </Box>
        </Box>
    )
}
