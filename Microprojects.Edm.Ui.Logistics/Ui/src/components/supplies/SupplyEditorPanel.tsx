import {
    type DetailProps,
    EMPTY_GUID,
    MuiEditor,
} from '@logistics/components/MasterDetail.tsx'
import type { DetailEventHandler } from '@logistics/data/types'
import {
    EditorSection,
    Field,
} from '@microprojects/edm-components/components'
import { Box } from '@mui/material'
import { useState } from 'react'

export interface SupplyEditorPanelProps extends DetailProps {
    onChange?: DetailEventHandler
    onUpdate?: DetailEventHandler
    path: string
    api: string
    type: string
}

export const SupplyEditorPanel = (props: SupplyEditorPanelProps) => {
    const [data, setData] = useState({ id: EMPTY_GUID })
    return (
        <MuiEditor
            type={props.type}
            api={props.api}
            path={props.path}
            onChange={props.onChange}
            data={data as any}
            setData={setData as any}
            onUpdate={props.onUpdate}
            content={({ values, handleChange }) => (
                <Box>
                    <EditorSection number={1} title="Supply" done={false}>
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
