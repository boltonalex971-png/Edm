import Api from '@features/api/api'
import { HierarchyPicker } from '@microprojects/edm-components/components/forms/HierarchyPicker'
import { useEntityToken } from '@microprojects/edm-components/hooks'
import { useGet } from '@microprojects/edm-components/hooks'
import { useBasePath } from '@microprojects/edm-components/hooks'
import {
    EditorSection,
    Field,
    Properties,
    Property,
} from '@microprojects/edm-components/components'
import {
    AccountTreeOutlined as ManufacturingIcon,
    PlayArrowOutlined as OperationIcon,
    PrecisionManufacturingOutlined as TechnologyIcon,
} from '@mui/icons-material'
import { Box, Typography } from '@mui/material'
import { type EffectCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import type {
    DetailEventHandler,
    Process,
    ProcessKind,
    TreeDataItem,
    UUID,
} from '../../../data/types'
import {
    Detail,
    type DetailProps,
    MasterDetail,
} from '../../MasterDetail'
import {
    Editor,
    EMPTY_GUID,
    Info,
} from '@microprojects/edm-components/components'
import './index' // side-effect: registers the `config/process` namespace
import { ProcessTabs } from './ProcessTabs'

export function Processes({ kind }: { kind?: ProcessKind }) {
    const type = 'process'
    const path = useBasePath()
    const navigate = useNavigate()
    const api = Api.processes
    const entityType = kind ? kind.toLowerCase() : 'process'
    const { t } = useTranslation('config/process')
    return (
        <MasterDetail
            type={type}
            api={api}
            entityType={entityType}
            getHierarchyQuery={kind ? () => ({ kind }) : undefined}
            path={path || ''}
            stubMessage={t('stubMessage')}
            detail={
                <ProcessDetail
                    type={type}
                    api={api}
                    path={path || ''}
                    kind={kind}
                    onClose={() => navigate(path)}
                />
            }
        />
    )
}

export interface ProcessDetailProps extends DetailProps {
    onChange?: DetailEventHandler
    onUpdate?: DetailEventHandler
    onClose: () => void
    path?: string
    api: string
    processId?: UUID
    type?: string
    kind?: ProcessKind
}

export function ProcessDetail({
    processId,
    kind,
    ...props
}: ProcessDetailProps) {
    const params = useParams<{ id: string }>()
    const id = processId?.toString() || params.id
    const [sub, setSub] = useState<React.ReactElement>()
    useEffect(setSub as EffectCallback, [id])
    const { t } = useTranslation('config/process')
    const [[noms]] = useGet<TreeDataItem[]>(
        `${Api.nomenclatures}/hierarchy`,
        [],
    )
    const entityToken = useEntityToken([
        { type: props.type ?? 'process', id: id },
    ])
    let [[data, setData], loading, error] = useGet<Process>(
        `${props.api}/${id}`,
        [id, entityToken],
    )
    if (!data || data.id === EMPTY_GUID) {
        data = { ...data, name: '', description: '' } as Process
    }

    if (kind && !data.kind) {
        data = { ...data, kind }
    }

    const missedInputs = JSON.parse(data.message || '[]')
    const effectiveKind = kind ?? (data.kind as ProcessKind | undefined)
    const kindForColor = effectiveKind?.toLowerCase()
    const ProcessKindIcon =
        effectiveKind === 'Technology'
            ? TechnologyIcon
            : effectiveKind === 'Operation'
              ? OperationIcon
              : ManufacturingIcon
    return (
        <Detail
            {...props}
            id={id}
            type={props.type ?? 'process'}
            entityType={kindForColor}
            icon={<ProcessKindIcon />}
            loading={loading}
            error={error as string}
            validation={
                missedInputs.length > 0
                    ? t('validation.parameter', {
                          count: missedInputs.length,
                          names: missedInputs.join(', '),
                      })
                    : ''
            }
            data={data}
            subDetail={sub}
            card={
                <Info
                    content={
                        data && (
                            <Properties>
                                <Property label={t('card.kind')} value={data.kind} />
                                <Property
                                    label={t('card.nomenclature')}
                                    value={data.nomenclatureName}
                                />
                            </Properties>
                        )
                    }
                />
            }
            editor={
                <Editor
                    type={props.type ?? 'process'}
                    api={props.api}
                    path={props.path}
                    onChange={props.onChange}
                    data={data}
                    setData={setData}
                    onUpdate={props.onUpdate}
                    content={({ values, handleChange, setValues }) => {
                        // Pin kind to the page-level prop when present so a
                        // Manufacturing list never accidentally creates a
                        // Technology process. Runs on every render but the
                        // setValues short-circuits if kind already matches.
                        if (kind && values.kind !== kind) {
                            queueMicrotask(() =>
                                setValues((prev: any) => ({ ...prev, kind })),
                            )
                        }

                        const nameMissing =
                            !!values.id &&
                            (!values.name || !String(values.name).trim())
                        const identityFilled = [
                            values.name,
                            values.description,
                            values.kind,
                        ].filter((v) => v && String(v).trim().length > 0).length
                        const targetFilled = values.nomenclatureId ? 1 : 0

                        return (
                            <Box>
                                <EditorSection
                                    number={1}
                                    title={t('section.identity')}
                                    filled={identityFilled}
                                    total={3}
                                    done={
                                        identityFilled === 3 && !nameMissing
                                    }
                                >
                                    <Field
                                        full
                                        name="name"
                                        label={t('field.name')}
                                        required
                                        value={(values.name as string) ?? ''}
                                        onChange={handleChange}
                                        state={
                                            nameMissing ? 'invalid' : 'pristine'
                                        }
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
                                        value={
                                            (values.description as string) ??
                                            ''
                                        }
                                        onChange={handleChange}
                                    />
                                    <Box>
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
                                            {t('field.processKind')}
                                        </Typography>
                                        <Box
                                            sx={{
                                                px: 1.25,
                                                py: 0.75,
                                                border: '1px solid var(--line-strong)',
                                                borderRadius: 'var(--r-2)',
                                                background: 'var(--surface-2)',
                                                color: 'var(--ink-2)',
                                                fontSize: 13,
                                                fontWeight: 500,
                                                minHeight: 'var(--field-h)',
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}
                                        >
                                            {(values.kind as string) ||
                                                kind ||
                                                '—'}
                                        </Box>
                                    </Box>
                                </EditorSection>

                                <EditorSection
                                    number={2}
                                    title={t('section.target')}
                                    filled={targetFilled}
                                    total={1}
                                    done={targetFilled === 1}
                                >
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
                                            {t('field.nomenclature')}
                                        </Typography>
                                        <HierarchyPicker
                                            data={noms}
                                            value={values.nomenclatureId}
                                            onChange={(v) =>
                                                handleChange({
                                                    target: {
                                                        name: 'nomenclatureId',
                                                        value: v,
                                                    },
                                                })
                                            }
                                        />
                                    </Box>
                                </EditorSection>
                            </Box>
                        )
                    }}
                />
            }
            relations={
                <ProcessTabs
                    id={id}
                    api={props.api}
                    kind={data.kind as ProcessKind}
                    missedInputs={missedInputs}
                    onDetailSelected={setSub}
                />
            }
        />
    )
}
