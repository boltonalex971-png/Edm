import {type DetailProps, Editor, EMPTY_GUID} from "@logistics/components/MasterDetail.tsx";
import {Field} from "@progress/kendo-react-form";
import {Input, NumericTextBox, TextBox} from "@progress/kendo-react-inputs";
import type {DetailEventHandler, UUID} from "@logistics/data/types";
import {useState} from "react";
import {ComboBox, ComboBoxProps, DropDownTree, DropDownTreeProps} from "@progress/kendo-react-dropdowns";
import * as React from "react";
import {Link45deg} from "react-bootstrap-icons";
import {useGet} from "@logistics/hooks/hooks";
import api from "@features/api/api";
import {DatePicker, DateTimePicker} from "@progress/kendo-react-dateinputs";

export interface OrderEditorPanelProps extends DetailProps {
    onChange?: DetailEventHandler,
    onUpdate?: DetailEventHandler
    onLink: (api: string) => void,
    onShow?: (api: string) => void,
    path: string,
    api: string,
    type: string,
}

export const OrderEditorPanel = (props: OrderEditorPanelProps) => {
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
                    <legend className={'k-form-legend'}>Enter order data</legend>
                    <div className="mb-2" style={{display: 'flex', alignItems: 'baseline'}}>
                        <Field name={'processId'}
                               component={(p) =>
                                   <LinkableComboBox {...p} api={api.processes}/>
                               }
                               label={'Process'}
                        />
                        <button onClick={() => props.onLink(api.processes)}
                                style={{backgroundColor: 'transparent', border: 'transparent'}}>
                            <Link45deg size={'1.4em'}/>
                        </button>
                    </div>
                    <div className="mb-2">
                        <Field name={'description'} component={Input} label={'Description'}/>
                    </div>
                    <div className="mb-2">
                        <Field name={'amount'} component={NumericTextBox} label={'Amount'}/>
                    </div>
                    <div className="mb-2">
                        <Field name={'startDate'} component={o =>
                            <DateTimePicker {...o} placeholder={''} width={400}/>
                        } label={'Start'}/>
                    </div>
                    <div className="mb-2">
                        <Field name={'dueDate'} component={o => 
                            <DateTimePicker {...o} placeholder={''} width={400}/>
                        } label={'Due'}/>
                    </div>
                </fieldset>
            }
        />
    )
}

type LinkableComboBoxProps = ComboBoxProps & React.RefAttributes<any> & {
    value: UUID
    api: string
}
export const LinkableComboBox = (props: LinkableComboBoxProps) => {
    const [[data]] = useGet<any[]>(props.api);
    return (
        <ComboBox {...props} data={data} dataItemKey={'id'} textField={'name'} value={{id: props.value}} />
    )
}