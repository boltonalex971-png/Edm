import api from '@features/api/api'
import {
    Detail,
    type DetailProps,
    EMPTY_GUID,
    Info,
    MuiEditor,
} from '@logistics/components/MasterDetail'
import '@logistics/components/supplies' // side-effect: registers the `supplies` namespace
import { SupplyTabs } from '@logistics/components/supplies/SupplyTabs'
import type { DetailEventHandler, Supply, UUID } from '@logistics/data/types'
import { useGet } from '@microprojects/edm-components/hooks'
import { formatLocalDateTime } from '@logistics/utils/format'
import {
    EditorSection,
    Field,
    Properties,
    Property,
} from '@microprojects/edm-components/components'
import { LocalShippingOutlined as SupplyIcon } from '@mui/icons-material'
import { Box } from '@mui/material'
import type React from 'react'
import { type EffectCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export interface SupplyDetailProps extends DetailProps {
    onUpdate?: DetailEventHandler
    type?: string
}

export function SupplyDetail({
    id,
    title,
    ...props
}: SupplyDetailProps) {
    const { t } = useTranslation('supplies')
    const resolvedTitle = title ?? t('detail.title')
    const [subDetail, setSubDetail] = useState<React.ReactElement>()
    useEffect(setSubDetail as EffectCallback, [id])

    let [[data, setData], loading, error] = useGet<Supply>(
        `${api.supplies}/${id || EMPTY_GUID}`,
        [id],
    )
    if (!data || data.id === EMPTY_GUID) {
        data = { ...data, name: '', description: '' } as any
    }

    const supplyId = (id as UUID) || (data.id as UUID)

    return (
        <Detail
            {...props}
            id={id}
            icon={<SupplyIcon />}
            title={resolvedTitle}
            subTitle={data.shipment || data.barcode}
            loading={loading}
            error={error as string}
            data={data as any}
            subDetail={subDetail}
            card={
                <Info
                    content={
                        <Properties>
                            <Property
                                label={t('field.barcode')}
                                value={data.barcode}
                                mono
                            />
                            <Property
                                label={t('field.shipment')}
                                value={data.shipment}
                            />
                            <Property
                                label={t('field.shipmentExternalId')}
                                value={data.shipmentExternalId}
                                mono
                            />
                            {(data as any).metaCreated && (
                                <Property
                                    label={t('field.created')}
                                    value={formatLocalDateTime(
                                        (data as any).metaCreated,
                                    )}
                                />
                            )}
                        </Properties>
                    }
                />
            }
            editor={
                <MuiEditor
                    type={props.type || 'none'}
                    api={props.api}
                    path={props.path}
                    onChange={props.onChange}
                    data={data as any}
                    setData={setData}
                    onUpdate={props.onUpdate}
                    content={({ values, handleChange }) => (
                        <Box>
                            <EditorSection
                                number={1}
                                title={t('detail.section')}
                                done={false}
                            >
                                <Field
                                    full
                                    name="barcode"
                                    label={t('field.barcode')}
                                    value={(values.barcode as string) ?? ''}
                                    onChange={handleChange}
                                />
                                <Field
                                    name="shipment"
                                    label={t('field.shipment')}
                                    value={(values.shipment as string) ?? ''}
                                    onChange={handleChange}
                                />
                                <Field
                                    name="shipmentExternalId"
                                    label={t('field.shipmentExternalId')}
                                    value={
                                        (values.shipmentExternalId as string) ??
                                        ''
                                    }
                                    onChange={handleChange}
                                />
                            </EditorSection>
                        </Box>
                    )}
                />
            }
            relations={
                supplyId && supplyId !== EMPTY_GUID ? (
                    <SupplyTabs
                        id={supplyId as UUID}
                        api={api.supplies}
                        onDetailSelected={setSubDetail}
                    />
                ) : null
            }
        />
    )
}
