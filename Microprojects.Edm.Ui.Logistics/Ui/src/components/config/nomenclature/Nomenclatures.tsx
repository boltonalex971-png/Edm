import Api from '@features/api/api'
import { useEntityToken } from '@microprojects/edm-components/hooks'
import { useGet } from '@microprojects/edm-components/hooks'
import { useBasePath } from '@microprojects/edm-components/hooks'
import {
    EditorSection,
    Field,
    Properties,
    Property,
} from '@microprojects/edm-components/components'
import { CategoryOutlined as NomenclatureIcon } from '@mui/icons-material'
import {
    Box,
    Checkbox,
    FormControlLabel,
} from '@mui/material'
import { type EffectCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import type {
    DetailEventHandler,
    Nomenclature,
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
import './index' // side-effect: registers the `config/nomenclature` namespace
import { NomenclatureTabs } from './NomenclatureTabs'

export function Nomenclatures() {
    const type = 'nomenclature'
    const path = useBasePath()
    const navigate = useNavigate()
    const api = Api.nomenclatures
    const { t } = useTranslation('config/nomenclature')
    return (
        <MasterDetail
            type={type}
            api={api}
            path={path || ''}
            stubMessage={t('stubMessage')}
            detail={
                <NomenclatureDetail
                    type={type}
                    api={api}
                    path={path || ''}
                    onClose={() => navigate(path)}
                />
            }
        />
    )
}

export interface NomenclatureDetailProps extends DetailProps {
    onUpdate?: DetailEventHandler
    type: string
}

export function NomenclatureDetail({ id, ...props }: NomenclatureDetailProps) {
    const params = useParams<{ id: string }>()
    const effectiveId = (id || params.id) as UUID | undefined
    const [sub, setSub] = useState<React.ReactElement>()
    useEffect(setSub as EffectCallback, [effectiveId])
    const { t } = useTranslation('config/nomenclature')
    const [[categories]] = useGet<string[]>(
        `${Api.nomenclatures}/categories`,
        [],
    )
    const entityToken = useEntityToken([
        { type: props.type, id: effectiveId },
    ])
    let [[data, setData], loading, error] = useGet<Nomenclature>(
        `${props.api}/${effectiveId}`,
        [effectiveId, entityToken],
    )
    if (!data || data.id === EMPTY_GUID) {
        data = { ...data, name: '', description: '' } as Nomenclature
    }

    return (
        <Detail
            {...props}
            id={effectiveId}
            icon={<NomenclatureIcon />}
            loading={loading}
            error={error as string}
            data={data}
            subDetail={sub}
            card={
                <Info
                    content={
                        data && (
                            <Properties>
                                <Property
                                    label={t('card.category')}
                                    value={data.category}
                                />
                                <Property
                                    label={t('card.countable')}
                                    value={data.countable ? t('common:yes') : t('common:no')}
                                />
                            </Properties>
                        )
                    }
                />
            }
            editor={
                <Editor
                    type={props.type}
                    api={props.api}
                    path={props.path}
                    onChange={props.onChange}
                    data={data}
                    setData={setData}
                    onUpdate={props.onUpdate}
                    content={({ values, handleChange }) => {
                        const nameMissing =
                            !!values.id &&
                            (!values.name || !String(values.name).trim())
                        const identityFilled = [values.name, values.description]
                            .filter(
                                (v) => v && String(v).trim().length > 0,
                            ).length
                        const classFilled = [
                            !!values.category,
                            values.countable !== undefined,
                        ].filter(Boolean).length
                        return (
                            <Box>
                                <EditorSection
                                    number={1}
                                    title={t('section.identity')}
                                    filled={identityFilled}
                                    total={2}
                                    done={identityFilled === 2 && !nameMissing}
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
                                </EditorSection>
                                <EditorSection
                                    number={2}
                                    title={t('section.classification')}
                                    filled={classFilled}
                                    total={2}
                                    done={classFilled === 2}
                                >
                                    <Field
                                        full
                                        kind="select"
                                        name="category"
                                        label={t('field.category')}
                                        placeholder="—"
                                        value={
                                            (values.category as string) ?? ''
                                        }
                                        onChange={handleChange}
                                        options={(categories || []).map(
                                            (c) => ({ value: c, label: c }),
                                        )}
                                    />
                                    <FormControlLabel
                                        sx={{ mt: 1 }}
                                        label={t('field.countable')}
                                        control={
                                            <Checkbox
                                                checked={!!values.countable}
                                                onChange={(e) =>
                                                    handleChange({
                                                        target: {
                                                            name: 'countable',
                                                            value: e.target
                                                                .checked,
                                                        },
                                                    })
                                                }
                                            />
                                        }
                                    />
                                </EditorSection>
                            </Box>
                        )
                    }}
                />
            }
            relations={
                effectiveId &&
                effectiveId !== EMPTY_GUID && (
                    <NomenclatureTabs
                        id={effectiveId}
                        api={props.api}
                        onDetailSelected={setSub}
                    />
                )
            }
        />
    )
}
