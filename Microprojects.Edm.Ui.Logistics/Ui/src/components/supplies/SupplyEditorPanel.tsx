import { type DetailProps } from '@microprojects/edm-components/components'
import {
    Editor,
    EMPTY_GUID,
} from '@microprojects/edm-components/components'
import '@logistics/components/supplies' // side-effect: registers the `supplies` namespace
import type { DetailEventHandler } from '@logistics/data/types'
import {
    EditorSection,
    Field,
} from '@microprojects/edm-components/components'
import { Box } from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export interface SupplyEditorPanelProps extends DetailProps {
    onChange?: DetailEventHandler
    onUpdate?: DetailEventHandler
    path: string
    api: string
    type: string
}

export const SupplyEditorPanel = (props: SupplyEditorPanelProps) => {
    const { t } = useTranslation('supplies')
    const [data, setData] = useState({ id: EMPTY_GUID })
    return (
        <Editor
            type={props.type}
            api={props.api}
            path={props.path}
            onChange={props.onChange}
            data={data as any}
            setData={setData as any}
            onUpdate={props.onUpdate}
            content={({ values, handleChange }) => (
                <Box>
                    <EditorSection number={1} title={t('detail.section')} done={false}>
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
                                (values.shipmentExternalId as string) ?? ''
                            }
                            onChange={handleChange}
                        />
                    </EditorSection>
                </Box>
            )}
        />
    )
}
