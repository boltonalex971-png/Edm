import {
    type AlertState,
    useAlertSetter,
} from '@logistics/components/InlineAlert.tsx'
import {MasterDetail as PkgMasterDetail} from '@microprojects/edm-components/components/master/MasterDetail'
import {
    Button,
    ButtonGroup,
    type ButtonProps,
    Toolbar,
    ToolbarItem,
} from '@progress/kendo-react-buttons'
import {Form, FormElement} from '@progress/kendo-react-form'
import {
    Card,
    CardBody,
    CardHeader,
    CardSubtitle,
    CardTitle,
} from '@progress/kendo-react-layout'
import axios from 'axios'
import type React from 'react'
import {
    type MouseEventHandler,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react'
import {useSelector} from 'react-redux'
import {useLocation, useNavigate} from 'react-router-dom'
import {Alert} from 'reactstrap'
import type {
    DataItem,
    DetailEventHandler,
    Dictionary,
    TreeDataItem,
    UUID,
} from '../data/types'
import api from '../features/api/api'
import type {RootState} from '../store'
import {Loading} from '../features/utils/Utils'
import {
    listTag,
    useEntityToken,
    useInvalidateEntities,
} from '../hooks/entityRefresh'
import {
    useAcquireEntityLock,
    useEntityLockState,
} from '../hooks/entityLocks'
import {Folder} from './config/Folder'

export const EMPTY_GUID = '00000000-0000-0000-0000-000000000000'

// Lets a nested Editor flip its parent Detail out of edit mode after a
// successful save. Detail provides it; Editor consumes it.
const DetailEditModeContext = createContext<
    ((editMode: boolean) => void) | undefined
>(undefined)

// Per-instance so it resets across kind navigations; module-level would drop new items into the previous view's folder when the new list is empty.
const RootItemContext = createContext<TreeDataItem | undefined>(undefined)

export type MasterDetailProps = {
    api: string
    getHierarchyQuery?: () => Record<string, string | undefined>
    stubMessage: string
    type: string
    detail: React.ReactElement
    path: string
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
                unwrapSingleRoot
            />
        </RootItemContext.Provider>
    )
}

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
}

export function Detail({
                           editable = true,
                           copyable = true,
                           deletable = true,
                           readonly = false,
                           ...props
                       }: DetailProps) {
    const navigate = useNavigate()
    const invalidate = useInvalidateEntities()
    const username = useSelector((s: RootState) => s.user.name)
    let [editMode, setEditMode] = useState(props.editMode)
    editMode = editMode || props.id === EMPTY_GUID

    // Cross-user edit lock. Only acquires for an existing entity (skipping
    // EMPTY_GUID — new items aren't yet shared) once the owner of the
    // Detail enters edit mode. The lock is released automatically when
    // editMode flips back, on unmount, or on tab close (best-effort).
    const lockableId =
        props.id && props.id !== EMPTY_GUID ? props.id : undefined
    useAcquireEntityLock(props.type, lockableId, editMode, username)
    const remoteLock = useEntityLockState(props.type, lockableId)
    const lockedByOther = !!remoteLock.lockedBy && !remoteLock.isOwn
    const outdated = !!(props.data as any)?.outdated

    // Force out of edit mode if another client took the lock first
    // (happens when both users press Edit nearly simultaneously and the
    // remote message arrives after our own local flip).
    useEffect(() => {
        if (lockedByOther && editMode && props.id !== EMPTY_GUID) {
            setEditMode(false)
        }
    }, [lockedByOther, editMode, props.id])

    return props.error ? (
        <Alert
            color="danger"
            style={{display: 'flex', justifyContent: 'space-around'}}
        >
            {props.error}
        </Alert>
    ) : (
        <DetailEditModeContext.Provider value={setEditMode}>
            <Card className="animated">
                {props.loading && props.id && (
                    <CardBody>
                        <Loading/>
                    </CardBody>
                )}
                {!(props.loading && props.id) && (
                    <>
                        <CardHeader
                            style={{
                                position: 'sticky',
                                top: 0,
                                display: 'flex',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div style={{display: 'flex'}}>
                                <div className="me-2">{props.icon}</div>
                                <div>
                                    <CardTitle>
                                        {props.title || props.data?.name}
                                        {lockedByOther && (
                                            <span
                                                style={{
                                                    marginLeft: '0.6rem',
                                                    fontSize: '0.85em',
                                                    fontWeight: 'normal',
                                                    color: '#b58900',
                                                }}
                                            >
                                                🔒 Locked by{' '}
                                                {remoteLock.lockedBy}
                                            </span>
                                        )}
                                        {outdated && (
                                            <span
                                                style={{
                                                    marginLeft: '0.6rem',
                                                    fontSize: '0.85em',
                                                    fontWeight: 'normal',
                                                    color: '#888',
                                                    fontStyle: 'italic',
                                                }}
                                                title="A newer version exists. This record is preserved for historical references and cannot be edited."
                                            >
                                                outdated
                                            </span>
                                        )}
                                    </CardTitle>
                                    <CardSubtitle>
                                        {props.subTitle ||
                                            props.data?.description}
                                    </CardSubtitle>
                                </div>
                            </div>
                            <Toolbar
                                style={{padding: '0', borderStyle: 'none'}}
                            >
                                <ToolbarItem>
                                    {props.editor && !readonly && (
                                        <ButtonGroup>
                                            <ToolbarButton
                                                visible={editable}
                                                title={
                                                    outdated
                                                        ? 'Outdated — open the current version to edit'
                                                        : lockedByOther
                                                            ? `Locked by ${remoteLock.lockedBy}`
                                                            : editMode
                                                                ? 'View mode'
                                                                : 'Edit mode'
                                                }
                                                icon={editMode ? 'eye' : 'edit'}
                                                fillMode="flat"
                                                disabled={
                                                    lockedByOther || outdated
                                                }
                                                onClick={() =>
                                                    setEditMode(!editMode)
                                                }
                                            />
                                            <ToolbarButton
                                                visible={copyable}
                                                title={
                                                    lockedByOther
                                                        ? `Locked by ${remoteLock.lockedBy}`
                                                        : 'Copy'
                                                }
                                                fillMode="flat"
                                                icon="copy"
                                                disabled={lockedByOther}
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    const data = {
                                                        ...props.data,
                                                        id: 0,
                                                        name: `${props.data?.name} (Copy)`,
                                                    }
                                                    axios
                                                        .post(
                                                            `${props.api}`,
                                                            data,
                                                        )
                                                        .then((response) => {
                                                            props.onChange &&
                                                            props.onChange()
                                                            if (props.type) {
                                                                invalidate([
                                                                    {
                                                                        type: props.type,
                                                                    },
                                                                    {
                                                                        type: props.type,
                                                                        id: response
                                                                            .data
                                                                            .id,
                                                                    },
                                                                    listTag(
                                                                        props.type,
                                                                    ),
                                                                ])
                                                            }
                                                            props.path &&
                                                            navigate(
                                                                `${props.path}/${response.data.id}`,
                                                            )
                                                        })
                                                }}
                                            />
                                            <ToolbarButton
                                                visible={deletable}
                                                title={
                                                    lockedByOther
                                                        ? `Locked by ${remoteLock.lockedBy}`
                                                        : 'Delete'
                                                }
                                                fillMode="flat"
                                                icon="delete"
                                                disabled={lockedByOther}
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    if (
                                                        window.confirm(
                                                            'Confirm deleting entity',
                                                        )
                                                    ) {
                                                        axios
                                                            .delete(
                                                                `${props.api}/${props.data?.id}`,
                                                            )
                                                            .then(() => {
                                                                props.onChange &&
                                                                props.onChange()
                                                                if (
                                                                    props.type
                                                                ) {
                                                                    invalidate([
                                                                        {
                                                                            type: props.type,
                                                                        },
                                                                        {
                                                                            type: props.type,
                                                                            id: props
                                                                                .data
                                                                                ?.id,
                                                                        },
                                                                        listTag(
                                                                            props.type,
                                                                        ),
                                                                    ])
                                                                }
                                                                props.path &&
                                                                navigate(
                                                                    props.path,
                                                                )
                                                            })
                                                    }
                                                }}
                                            />
                                        </ButtonGroup>
                                    )}
                                </ToolbarItem>
                                <ToolbarItem>
                                    <ButtonGroup>
                                        <ToolbarButton
                                            visible={true}
                                            title="Move Up"
                                            fillMode="flat"
                                            icon="arrow-up"
                                            onClick={props.onUp}
                                        />
                                        <ToolbarButton
                                            visible={true}
                                            title="Close"
                                            fillMode="flat"
                                            icon="close"
                                            onClick={props.onClose}
                                        />
                                    </ButtonGroup>
                                </ToolbarItem>
                            </Toolbar>
                        </CardHeader>
                        <CardBody style={{position: 'relative'}}>
                            {props.validation && (
                                <Alert
                                    color="warning"
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-around',
                                    }}
                                >
                                    {props.validation}
                                </Alert>
                            )}
                            {(editMode && props.editor) || props.card}
                            {!editMode && props.relations}
                        </CardBody>
                    </>
                )}
            </Card>
            <div className="mt-2"/>
            {props.subDetail}
        </DetailEditModeContext.Provider>
    )
}

type ToolbarButtonProps = ButtonProps & {
    visible?: boolean
}

function ToolbarButton({visible, ...props}: ToolbarButtonProps) {
    return visible ? <Button {...props} /> : null
}

type InfoProps = {
    content: React.ReactNode | ((formRenderProps: any) => React.ReactNode)
    //data: TreeNode
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

interface EditorProps extends InfoProps {
    data: DataItem
    setData: DetailEventHandler
    type: string
    onUpdate?: DetailEventHandler
    onChange?: DetailEventHandler
    api: string
    path?: string
}

export function Editor(props: EditorProps) {
    const navigate = useNavigate()
    const location = useLocation()
    const setAlert = useAlertSetter()
    const setDetailEditMode = useContext(DetailEditModeContext)
    const rootItem = useContext(RootItemContext)
    const invalidate = useInvalidateEntities()
    const mode =
        (props.data.id && props.data.id !== EMPTY_GUID && 'Update') || 'Create'
    const handleSubmit = (data: Dictionary) => {
        setAlert(undefined)
        const foreignData = Object.keys(data).reduce(
            (r, d, i, a) => ({
                ...r,
                [d]:
                    data[d] &&
                    typeof data[d] === 'object' &&
                    !(data[d] instanceof Date) &&
                    !Array.isArray(data[d])
                        ? data[d]['id']
                        : data[d],
            }),
            {},
        )
        if (data.id && data.id !== EMPTY_GUID) {
            const sendUpdate = (force: boolean) => {
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
                            if (
                                window.confirm(
                                    `${detail}\n\nProceed and create a new version?`,
                                )
                            ) {
                                return sendUpdate(true)
                            }
                            return
                        }
                        setAlert({
                            status: 'danger',
                            message:
                                r.response?.data?.detail || 'Unknown error',
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
                        message: r.response?.data?.detail || 'Unknown error',
                    }),
                )
        }
    }

    return (
        <>
            <Form
                key={props.data.id}
                initialValues={props.data}
                onSubmit={handleSubmit}
                render={(formRenderProps) => (
                    <FormElement>
                        {typeof props.content === 'function'
                            ? props.content(formRenderProps)
                            : props.content}
                        <div
                            className="k-form-buttons"
                            style={{
                                position: 'sticky',
                                bottom: 10,
                                display: 'flex',
                                justifyContent: 'space-between',
                                backgroundColor: 'white',
                            }}
                        >
                            <Button
                                title="Save"
                                name="save"
                                themeColor={
                                    formRenderProps.allowSubmit
                                        ? 'primary'
                                        : 'secondary'
                                }
                                icon="save"
                                type={'submit'}
                                disabled={!formRenderProps.allowSubmit}
                            >
                                {mode}
                            </Button>
                        </div>
                    </FormElement>
                )}
            />
        </>
    )
}
