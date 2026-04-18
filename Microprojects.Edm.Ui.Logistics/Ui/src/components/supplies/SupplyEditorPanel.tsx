import {
    type DetailProps,
    EMPTY_GUID,
    Editor,
} from '@logistics/components/MasterDetail.tsx'
import type { DetailEventHandler } from '@logistics/data/types'
import { Field } from '@progress/kendo-react-form'
import { Input } from '@progress/kendo-react-inputs'
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
        <Editor
            type={props.type}
            api={props.api}
            path={props.path}
            onChange={props.onChange}
            data={data}
            setData={setData}
            onUpdate={props.onUpdate}
            content={
                <fieldset className={'k-form-fieldset'}>
                    <legend className={'k-form-legend'}>
                        Enter supply data
                    </legend>
                    <div
                        className="mb-2"
                        style={{ display: 'flex', alignItems: 'baseline' }}
                    >
                        <Field
                            name={'barcode'}
                            component={Input}
                            label={'Barcode'}
                        />
                    </div>
                    <div className="mb-2">
                        <Field
                            name={'shipment'}
                            component={Input}
                            label={'Shipment'}
                        />
                    </div>
                    <div className="mb-2">
                        <Field
                            name={'shipmentExternalId'}
                            component={Input}
                            label={'Shipment Id'}
                        />
                    </div>
                </fieldset>
            }
        />
    )
}
