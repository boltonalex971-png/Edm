import api from '@features/api/api'
import Api from '@features/api/api'
import {
    Detail,
    type DetailProps,
    EMPTY_GUID,
    Info,
    MuiEditor,
} from '@logistics/components/MasterDetail'
import { BatchItemCreate } from '@logistics/components/items/BatchItemCreate'
import { ItemDetail } from '@logistics/components/items/ItemDetail'
import { TareDetail } from '@logistics/components/tare/TareDetail'
import { TareItemsPanel } from '@logistics/components/tare/TareItemsPanel'
import type { DetailEventHandler, Supply, UUID } from '@logistics/data/types'
import { useGet } from '@logistics/hooks/hooks'
import { formatLocalDateTime } from '@logistics/utils/format'
import {
    EditorSection,
    Field,
    Properties,
    Property,
} from '@microprojects/edm-components/components'
import { AddOutlined as AddIcon } from '@mui/icons-material'
import { Box, Button as MuiButton } from '@mui/material'
import type React from 'react'
import { type EffectCallback, useEffect, useState } from 'react'
import { Diagram3 } from 'react-bootstrap-icons'

export interface SupplyDetailProps extends DetailProps {
    onUpdate?: DetailEventHandler
    type?: string
}

export function SupplyDetail({
    id,
    title = 'Supply',
    ...props
}: SupplyDetailProps) {
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
            icon={<Diagram3 title="Supply" />}
            title={title}
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
                                label="Barcode"
                                value={data.barcode}
                                mono
                            />
                            <Property
                                label="Shipment"
                                value={data.shipment}
                            />
                            <Property
                                label="Shipment Id"
                                value={data.shipmentExternalId}
                                mono
                            />
                            {(data as any).metaCreated && (
                                <Property
                                    label="Created"
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
                                title="Supply"
                                done={false}
                            >
                                <Field
                                    full
                                    name="barcode"
                                    label="Barcode"
                                    value={(values.barcode as string) ?? ''}
                                    onChange={handleChange}
                                />
                                <Field
                                    name="shipment"
                                    label="Shipment"
                                    value={(values.shipment as string) ?? ''}
                                    onChange={handleChange}
                                />
                                <Field
                                    name="shipmentExternalId"
                                    label="Shipment Id"
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
                    <TareItemsPanel
                        api={`${api.supplies}/${supplyId}/items`}
                        supplyId={supplyId as UUID}
                        onTareClick={(group) =>
                            setSubDetail(
                                <TareDetail
                                    tareId={group.tare.id}
                                    label={group.tare.barcode}
                                    onClose={() => setSubDetail(undefined)}
                                />,
                            )
                        }
                        onItemClick={(item) =>
                            setSubDetail(
                                <ItemDetail
                                    readonly={true}
                                    id={item.id}
                                    api={Api.items}
                                    onClose={() => setSubDetail(undefined)}
                                />,
                            )
                        }
                        toolbar={
                            <Box sx={{ mb: 1 }}>
                                <MuiButton
                                    variant="contained"
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={() =>
                                        setSubDetail(
                                            <BatchItemCreate
                                                supplyId={supplyId as UUID}
                                                onClose={() =>
                                                    setSubDetail(undefined)
                                                }
                                            />,
                                        )
                                    }
                                >
                                    Add items
                                </MuiButton>
                            </Box>
                        }
                    />
                ) : null
            }
        />
    )
}
