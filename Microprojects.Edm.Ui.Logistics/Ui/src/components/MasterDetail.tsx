import {
    type AlertState,
    InlineAlert,
} from '@logistics/components/InlineAlert.tsx'
import {SmartScroll, SmartScrollContent} from '@microprojects/tools'
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
    useRef,
    useState,
} from 'react'
import {useSelector} from 'react-redux'
import {Route, Routes, useLocation, useNavigate} from 'react-router-dom'
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
import {DetailStub, Loading} from '../features/utils/Utils'
import {
    useEntityToken,
    useInvalidateEntities,
} from '../hooks/entityRefresh'
import {
    useAcquireEntityLock,
    useEntityLockState,
} from '../hooks/entityLocks'
import {useBasePath} from '../hooks/routerHooks'
import {TreeViewMaster} from './TreeViewMaster'
import type {TreeItemProps} from './TreeViewMaster'
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
    item?: (props: TreeItemProps) => React.ReactElement
    stubMessage: string
    type: string
    detail: React.ReactElement
    path: string
}

const SEPARATOR_MIN_PX = 80

export function MasterDetail(props: MasterDetailProps) {
    const {path} = useBasePath()
    const navigate = useNavigate()
    const treeToken = useEntityToken([{type: props.type}])
    const [rootItem, setRootItem] = useState<TreeDataItem | undefined>(undefined)

    const containerRef = useRef<HTMLDivElement | null>(null)
    const [masterPx, setMasterPx] = useState<number | null>(null)
    const [mode, setMode] = useState<'auto' | 'manual'>('auto')

    // Re-clamp the manual width when the viewport changes so the master
    // pane never exceeds 1/3 of the new container width.
    useEffect(() => {
        const el = containerRef.current
        if (!el || mode !== 'manual') return
        const reclamp = () => {
            const cap = Math.floor(el.getBoundingClientRect().width / 3)
            setMasterPx((prev) =>
                prev != null && prev > cap ? Math.max(SEPARATOR_MIN_PX, cap) : prev,
            )
        }
        const ro = new ResizeObserver(reclamp)
        ro.observe(el)
        return () => ro.disconnect()
    }, [mode])

    const onSeparatorDrag = useCallback((clientX: number) => {
        const el = containerRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const cap = Math.floor(rect.width / 3)
        const next = Math.max(
            SEPARATOR_MIN_PX,
            Math.min(cap, Math.round(clientX - rect.left)),
        )
        setMasterPx(next)
        setMode('manual')
    }, [])

    const masterStyle: React.CSSProperties =
        mode === 'manual' && masterPx != null
            ? {
                flex: `0 0 ${masterPx}px`,
                maxWidth: '33.333%',
                minWidth: 0,
                overflow: 'hidden',
            }
            : {
                flex: '0 0 auto',
                maxWidth: '33.333%',
                minWidth: 0,
                overflow: 'hidden',
            }

    return (
        <RootItemContext.Provider value={rootItem}>
            <div ref={containerRef} style={{width: '100%'}}>
                <SmartScroll
                    offsetTop={10}
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                    }}
                >
                    <SmartScrollContent style={masterStyle}>
                        <TreeViewMaster
                            api={props.api}
                            getHierarchyQuery={props.getHierarchyQuery}
                            onRootLoaded={setRootItem}
                            item={props.item}
                            refreshToken={treeToken}
                            publishType={props.type}
                        />
                    </SmartScrollContent>
                    <PaneSeparator onDrag={onSeparatorDrag}/>
                    <SmartScrollContent style={{flex: 1, minWidth: 0}}>
                        <Routes>
                            <Route
                                index
                                element={<DetailStub message={props.stubMessage}/>}
                            />
                            <Route
                                path={'folder/:id'}
                                element={
                                    <Folder
                                        api={api.directories}
                                        type={props.type}
                                        path={path}
                                        onClose={() => navigate(path)}
                                    />
                                }
                            />
                            <Route
                                path={':id'}
                                element={
                                    <>
                                        {props.detail}
                                        <div style={{height: '40vh'}}>
                                            {/*div to avoid ui jerking when switching cards at bottom*/}
                                        </div>
                                    </>
                                }
                            />
                        </Routes>
                    </SmartScrollContent>
                </SmartScroll>
            </div>
        </RootItemContext.Provider>
    )
}

type PaneSeparatorProps = {
    onDrag: (clientX: number) => void
}

const PaneSeparator = ({onDrag}: PaneSeparatorProps) => {
    // While dragging we render a small vertical guide segment centered on
    // the cursor. `null` while idle keeps the indicator out of the DOM so
    // the separator stays invisible at rest.
    const [guide, setGuide] = useState<{ x: number; y: number } | null>(null)

    const update = (e: React.PointerEvent<HTMLDivElement>) => {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
        setGuide({x: rect.left + rect.width / 2, y: e.clientY})
        onDrag(e.clientX)
    }

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
        document.body.style.userSelect = 'none'
        document.body.style.cursor = 'col-resize'
        update(e)
    }

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!guide) return
        update(e)
    }

    const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!guide) return
        document.body.style.userSelect = ''
        document.body.style.cursor = ''
        ;(e.currentTarget as HTMLDivElement).releasePointerCapture?.(e.pointerId)
        setGuide(null)
    }

    const GUIDE_HALF = 110 // px above and below the cursor

    return (
        <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            role="separator"
            aria-orientation="vertical"
            style={{
                // Generous, invisible hit area — easier to grab without being
                // visually noisy at rest.
                flex: '0 0 16px',
                alignSelf: 'stretch',
                cursor: 'col-resize',
                touchAction: 'none',
                background: 'transparent',
                minHeight: '60vh',
            }}
        >
            {guide && (
                <div
                    style={{
                        position: 'fixed',
                        left: guide.x,
                        top: guide.y - GUIDE_HALF,
                        width: 2,
                        height: GUIDE_HALF * 2,
                        transform: 'translateX(-50%)',
                        // Vertical gradient fading at both ends — feels like
                        // a "drag handle" tied to the cursor without painting
                        // the entire viewport.
                        background:
                            'linear-gradient(to bottom, rgba(120, 144, 156, 0) 0%, rgba(120, 144, 156, 0.7) 50%, rgba(120, 144, 156, 0) 100%)',
                        borderRadius: 1,
                        pointerEvents: 'none',
                        zIndex: 1000,
                    }}
                />
            )}
        </div>
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
                                                    lockedByOther
                                                        ? `Locked by ${remoteLock.lockedBy}`
                                                        : editMode
                                                            ? 'View mode'
                                                            : 'Edit mode'
                                                }
                                                icon={editMode ? 'eye' : 'edit'}
                                                fillMode="flat"
                                                disabled={lockedByOther}
                                                onClick={() =>
                                                    setEditMode(!editMode)
                                                }
                                            />
                                            <ToolbarButton
                                                visible={copyable}
                                                title="Copy"
                                                fillMode="flat"
                                                icon="copy"
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
                                                title="Delete"
                                                fillMode="flat"
                                                icon="delete"
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
    const [alert, setAlert] = useState<AlertState>()
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
            axios
                .put(`${props.api}/${props.data.id}`, foreignData)
                .then((response) => {
                    props.onUpdate?.(response.data)
                    props.onChange?.(response.data)
                    props.setData(response.data)
                    invalidate([
                        {type: props.type},
                        {type: props.type, id: response.data.id},
                    ])
                    setAlert({message: 'Updated successfully'})
                    setDetailEditMode?.(false)
                })
                .catch((r) =>
                    setAlert({
                        status: 'danger',
                        message: r.response?.data?.detail || 'Unknown error',
                    }),
                )
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
            <InlineAlert state={alert} onClose={() => setAlert(undefined)}/>
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
