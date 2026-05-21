import Api from '@features/api/api'
import { useEntityToken } from '@logistics/hooks/entityRefresh'
import { useGet } from '@logistics/hooks/hooks'
import { useBasePath } from '@logistics/hooks/routerHooks'
import {
    EditorSection,
    Field,
} from '@microprojects/edm-components/components'
import {
    Properties,
    Property,
} from '@microprojects/edm-components/components/forms/Properties'
import {
    Box,
    Checkbox,
    FormControlLabel,
    Radio,
    RadioGroup,
    Typography,
} from '@mui/material'
import { AllInboxOutlined as TareTypeIcon } from '@mui/icons-material'
import { type EffectCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import type { DetailEventHandler, TareType, UUID } from '../../../data/types'
import {
    Detail,
    type DetailProps,
    EMPTY_GUID,
    Info,
    MasterDetail,
    MuiEditor,
} from '../../MasterDetail'
import './index' // side-effect: registers the `config/taretype` namespace
import { TareTypeTabs } from './TareTypeTabs'

function formatSize(data: TareType) {
    const parts = [data.sizeX, data.sizeY, data.sizeZ].filter(
        (v) => v != null && v > 0,
    )
    return parts.length > 0 ? parts.join(' × ') : '—'
}

type CountableLayoutMode = 'bulk' | 'slots'

// Numeric coercion helper for native <input type="number"> + Field. Empty string → null; otherwise Number().
function numberOrNull(v: string): number | null {
    if (v === '' || v == null) return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
}

export function TareTypes() {
    const type = 'taretype'
    const { path } = useBasePath()
    const navigate = useNavigate()
    const api = Api.taretypes
    const { t } = useTranslation('config/taretype')
    return (
        <MasterDetail
            type={type}
            api={api}
            path={path || ''}
            stubMessage={t('stubMessage')}
            detail={
                <TareTypeDetail
                    type={type}
                    api={api}
                    path={path || ''}
                    onClose={() => navigate(path)}
                />
            }
        />
    )
}

export interface TareTypeDetailProps extends DetailProps {
    onChange?: DetailEventHandler
    onUpdate?: DetailEventHandler
    onClose: () => void
    path: string
    api: string
    id?: UUID
    type: string
}

export function TareTypeDetail({ id, ...props }: TareTypeDetailProps) {
    const params = useParams<{ id: string }>()
    const effectiveId = (id || params.id) as UUID | undefined
    const [sub, setSub] = useState<React.ReactElement>()
    useEffect(setSub as EffectCallback, [effectiveId])
    const { t } = useTranslation('config/taretype')
    const entityToken = useEntityToken([
        { type: props.type, id: effectiveId },
    ])
    let [[data, setData], loading, error] = useGet<TareType>(
        `${props.api}/${effectiveId}`,
        [effectiveId, entityToken],
    )
    if (!data || data.id === EMPTY_GUID) {
        data = { ...data, name: '', description: '' } as TareType
    }

    return (
        <Detail
            {...props}
            id={effectiveId}
            icon={<TareTypeIcon />}
            loading={loading}
            error={error as string}
            data={data}
            subDetail={sub}
            relations={
                effectiveId &&
                effectiveId !== EMPTY_GUID && (
                    <TareTypeTabs
                        id={effectiveId}
                        api={props.api}
                        onDetailSelected={setSub}
                    />
                )
            }
            card={
                <Info
                    content={
                        data && (
                            <Properties>
                                <Property label={t('card.countable')} value={data.countable ? t('common:yes') : t('common:no')} />
                                <Property label={t('card.measuredIn')} value={data.units} mono />
                                {data.countable && <Property label={t('card.size')} value={formatSize(data)} mono />}
                                <Property label={t('card.capacity')} value={data.capacity} mono />
                            </Properties>
                        )
                    }
                />
            }
            editor={
                <MuiEditor
                    type={props.type}
                    api={props.api}
                    path={props.path}
                    onChange={props.onChange}
                    data={data}
                    setData={setData}
                    onUpdate={props.onUpdate}
                    content={({ values, handleChange, setValues }) => (
                        <TareTypeEditorBody
                            values={values}
                            handleChange={handleChange}
                            setValues={setValues}
                        />
                    )}
                />
            }
        />
    )
}

interface EditorBodyProps {
    values: any
    handleChange: (e: { target: { name: string; value: unknown } }) => void
    setValues: (next: any | ((prev: any) => any)) => void
}

function TareTypeEditorBody({ values, handleChange, setValues }: EditorBodyProps) {
    const { t } = useTranslation('config/taretype')
    const countable = !!values.countable
    const x = Number(values.sizeX) || 0
    const y = Number(values.sizeY) || 0
    const z = Number(values.sizeZ) || 0

    const inferredMode: CountableLayoutMode = x > 0 ? 'slots' : 'bulk'
    const [mode, setMode] = useState<CountableLayoutMode>(inferredMode)

    useEffect(() => {
        setMode(x > 0 ? 'slots' : 'bulk')
    }, [x])

    const nameMissing =
        !!values.id && (!values.name || !String(values.name).trim())
    const identityFilled = [values.name, values.description, values.units]
        .filter((v) => v && String(v).trim().length > 0).length

    const capacityFilled = useMemo(() => {
        if (!countable) return values.capacity ? 1 : 0
        if (mode === 'bulk') return values.capacity ? 1 : 0
        return x > 0 ? 1 : 0
    }, [countable, mode, x, values.capacity])

    const switchToBulk = () => {
        setMode('bulk')
        setValues((prev: any) => ({
            ...prev,
            sizeX: null,
            sizeY: null,
            sizeZ: null,
            capacity: Math.round(Number(prev.capacity) || 1) || 1,
        }))
    }

    const switchToSlots = () => {
        setMode('slots')
        setValues((prev: any) => ({
            ...prev,
            sizeX: Number(prev.sizeX) > 0 ? prev.sizeX : 1,
        }))
    }

    const computedCapacity = Math.max(1, (x || 1) * (y || 1) * (z || 1))

    return (
        <Box>
            <EditorSection
                number={1}
                title={t('section.identity')}
                filled={identityFilled}
                total={3}
                done={identityFilled === 3 && !nameMissing}
            >
                <Field
                    full
                    name="name"
                    label={t('field.name')}
                    required
                    value={(values.name as string) ?? ''}
                    onChange={handleChange}
                    state={nameMissing ? 'invalid' : 'pristine'}
                    help={
                        nameMissing
                            ? t('help.nameMissing')
                            : t('help.name')
                    }
                />
                <Field
                    full
                    kind="textarea"
                    name="description"
                    label={t('field.description')}
                    rows={2}
                    value={(values.description as string) ?? ''}
                    onChange={handleChange}
                />
                <Field
                    name="units"
                    label={t('field.units')}
                    placeholder={t('field.unitsPlaceholder')}
                    value={(values.units as string) ?? ''}
                    onChange={handleChange}
                    help={t('field.unitsHelp')}
                />
            </EditorSection>

            <EditorSection
                number={2}
                title={t('section.capacity')}
                filled={capacityFilled}
                total={1}
                done={capacityFilled === 1}
            >
                <Box sx={{ gridColumn: '1 / -1' }}>
                    <FormControlLabel
                        label={t('field.countable')}
                        control={
                            <Checkbox
                                checked={countable}
                                onChange={(e) =>
                                    handleChange({
                                        target: {
                                            name: 'countable',
                                            value: e.target.checked,
                                        },
                                    })
                                }
                            />
                        }
                    />
                    <Typography
                        variant="caption"
                        sx={{ display: 'block', color: 'var(--ink-3)' }}
                    >
                        {t('field.countableHelp')}
                    </Typography>
                </Box>

                {countable ? (
                    <>
                        <Box sx={{ gridColumn: '1 / -1' }}>
                            <Typography
                                sx={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.07em',
                                    color: 'var(--ink-3)',
                                    mb: 0.5,
                                }}
                            >
                                {t('field.layout')}
                            </Typography>
                            <RadioGroup
                                row
                                value={mode}
                                onChange={(e) => {
                                    if (e.target.value === 'bulk') {
                                        switchToBulk()
                                    } else {
                                        switchToSlots()
                                    }
                                }}
                            >
                                <FormControlLabel
                                    value="bulk"
                                    control={<Radio size="small" />}
                                    label={t('field.bulk')}
                                />
                                <FormControlLabel
                                    value="slots"
                                    control={<Radio size="small" />}
                                    label={t('field.slots')}
                                />
                            </RadioGroup>
                            <Typography
                                variant="caption"
                                sx={{
                                    display: 'block',
                                    color: 'var(--ink-3)',
                                }}
                            >
                                {t('field.layoutHelp')}
                            </Typography>
                        </Box>

                        {mode === 'slots' ? (
                            <>
                                <Box
                                    sx={{
                                        gridColumn: '1 / -1',
                                        display: 'flex',
                                        gap: 1,
                                        alignItems: 'flex-end',
                                    }}
                                >
                                    <Box sx={{ width: 120 }}>
                                        <Field
                                            type="number"
                                            name="sizeX"
                                            label="X"
                                            placeholder="X"
                                            value={values.sizeX ?? ''}
                                            onChange={(e) => {
                                                const v = numberOrNull(
                                                    e.target.value,
                                                )
                                                setValues((prev: any) => ({
                                                    ...prev,
                                                    sizeX: v && v > 0 ? v : null,
                                                    ...(v && v > 0
                                                        ? {}
                                                        : {
                                                              sizeY: null,
                                                              sizeZ: null,
                                                          }),
                                                }))
                                            }}
                                        />
                                    </Box>
                                    <Typography sx={{ pb: 1, color: 'var(--ink-4)' }}>
                                        ×
                                    </Typography>
                                    <Box sx={{ width: 120 }}>
                                        <Field
                                            type="number"
                                            name="sizeY"
                                            label="Y"
                                            placeholder="Y"
                                            value={values.sizeY ?? ''}
                                            disabled={x <= 0}
                                            onChange={(e) => {
                                                const v = numberOrNull(
                                                    e.target.value,
                                                )
                                                setValues((prev: any) => ({
                                                    ...prev,
                                                    sizeY: v && v > 0 ? v : null,
                                                    ...(v && v > 0
                                                        ? {}
                                                        : { sizeZ: null }),
                                                }))
                                            }}
                                        />
                                    </Box>
                                    <Typography sx={{ pb: 1, color: 'var(--ink-4)' }}>
                                        ×
                                    </Typography>
                                    <Box sx={{ width: 120 }}>
                                        <Field
                                            type="number"
                                            name="sizeZ"
                                            label="Z"
                                            placeholder="Z"
                                            value={values.sizeZ ?? ''}
                                            disabled={y <= 0}
                                            onChange={(e) =>
                                                handleChange({
                                                    target: {
                                                        name: 'sizeZ',
                                                        value: numberOrNull(
                                                            e.target.value,
                                                        ),
                                                    },
                                                })
                                            }
                                        />
                                    </Box>
                                </Box>
                                {x > 0 && (
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            gridColumn: '1 / -1',
                                            color: 'var(--ink-3)',
                                        }}
                                    >
                                        {t('field.computedCapacity', { count: computedCapacity })}
                                    </Typography>
                                )}
                            </>
                        ) : (
                            <Box sx={{ gridColumn: '1 / -1', maxWidth: 240 }}>
                                <Field
                                    type="number"
                                    name="capacity"
                                    label={
                                        values.units
                                            ? t('field.capacityWithUnits', { units: values.units })
                                            : t('field.capacity')
                                    }
                                    value={values.capacity ?? ''}
                                    onChange={(e) =>
                                        handleChange({
                                            target: {
                                                name: 'capacity',
                                                value: Math.round(
                                                    numberOrNull(
                                                        e.target.value,
                                                    ) ?? 1,
                                                ),
                                            },
                                        })
                                    }
                                />
                            </Box>
                        )}
                    </>
                ) : (
                    <Box sx={{ gridColumn: '1 / -1', maxWidth: 240 }}>
                        <Field
                            type="number"
                            name="capacity"
                            label={
                                values.units
                                    ? t('field.capacityWithUnits', { units: values.units })
                                    : t('field.capacity')
                            }
                            value={values.capacity ?? ''}
                            onChange={(e) =>
                                handleChange({
                                    target: {
                                        name: 'capacity',
                                        value:
                                            numberOrNull(e.target.value) ?? 1,
                                    },
                                })
                            }
                        />
                    </Box>
                )}
            </EditorSection>
        </Box>
    )
}
