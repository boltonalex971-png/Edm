import {type DetailProps, Editor, EMPTY_GUID} from "@logistics/components/MasterDetail.tsx";
import {Field} from "@progress/kendo-react-form";
import {Input, NumericTextBox, TextBox} from "@progress/kendo-react-inputs";
import type {DetailEventHandler} from "@logistics/data/types";
import {useState} from "react";
import {ComboBox, ComboBoxProps, DropDownTree, DropDownTreeProps} from "@progress/kendo-react-dropdowns";
import * as React from "react";
import {Link45deg} from "react-bootstrap-icons";
import {useGet} from "@logistics/hooks/hooks";
import api from "@features/api/api";

export interface SupplyEditorPanelProps extends DetailProps {
    onChange?: DetailEventHandler,
    onUpdate?: DetailEventHandler
    onLink: (api: string) => void,
    onShow?: (api: string) => void,
    path: string,
    api: string,
    type: string,
}

export const SupplyEditorPanel = (props: SupplyEditorPanelProps) => {
    const [data, setData] = useState({id: EMPTY_GUID})
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
                    <legend className={'k-form-legend'}>Enter supply data</legend>
                    <div className="mb-2" style={{display: 'flex', alignItems: 'baseline'}}>
                        <Field name={'nomenclatureId'}
                               component={(p) =>
                                   <LinkableComboBox {...p} api={api.nomenclatures}/>
                               }
                               label={'Nomenclature'}
                        />
                        <button onClick={() => props.onLink(api.nomenclatures)}
                                style={{backgroundColor: 'transparent', border: 'transparent'}}>
                            <Link45deg size={'1.4em'}/>
                        </button>
                    </div>
                    <div className="mb-2" style={{display: 'flex', alignItems: 'baseline'}}>
                        <Field name={'tareTareTypeId'}
                               component={(p) =>
                                   <LinkableComboBox {...p} api={api.taretypes}/>
                               }
                               label={'Tare Type'}
                        />
                        <button onClick={() => props.onLink(api.taretypes)}
                                style={{backgroundColor: 'transparent', border: 'transparent'}}>
                            <Link45deg size={'1.4em'}/>
                        </button>
                    </div>
                    <div className="mb-2">
                        <Field name={'shipment'} component={Input} label={'Shipment'}/>
                    </div>
                    <div className="mb-2">
                        <Field name={'externalShipmentId'} component={Input} label={'Shipment Id'}/>
                    </div>
                    <div className="mb-2">
                        <Field name={'tareBarcode'} component={Input} label={'Tare Barcode'}/>
                    </div>
                    <div className="mb-2">
                        <Field name={'serialNo'} component={Input} label={'Serial No'}/>
                    </div>
                    <div className="mb-2">
                        <Field name={'quantity'} component={NumericTextBox} label={'Quantity'}/>
                    </div>
                </fieldset>
            }
        />
    )
}

type LinkableComboBoxProps = ComboBoxProps & React.RefAttributes<any> & {
    api: string;
}
export const LinkableComboBox = (props: LinkableComboBoxProps) => {
    const [[data]] = useGet<any[]>(props.api);
    return (
        <ComboBox {...props} data={data} dataItemKey={'id'} textField={'name'} />
    )
}