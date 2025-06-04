import React, {useEffect, useState} from "react";
import {Input} from "@progress/kendo-react-inputs";
import axios from "axios";
import {Button, Chip, ChipList} from "@progress/kendo-react-buttons";
import {useLocation} from "react-router-dom";
import {Field, Form, FormElement} from '@progress/kendo-react-form';
import {MultiSelect} from "@progress/kendo-react-dropdowns";
import {OpcParams} from "./OpcParams";
import {EndpointContext} from "../Contexts";

let setCard;

export const Options = ({data, onChange}) => {
    const [output, setOutput] = useState()
    const [endpoint, setEndpoint] = useState()
    useEffect(() => {
        if (!data)
            return;
        const profileOutput = data.output?.reduce((acc, cur) => ({...acc, [cur]: {text: cur, profile: true}}), {}) || {}
        const driverOutput = data.options?.output?.reduce((acc, cur) => ({...acc, [cur.text]: cur}), {}) || {}
        const outputs = Object.keys({...profileOutput, ...driverOutput}).map(key => ({...profileOutput[key], ...driverOutput[key]}))
        setOutput(Object.values(outputs))
        setEndpoint(data.options?.endpoint)

    }, [data]);
    const bindOutput = (bound) => {
        const outParam = output.find(p => p.text === bound.text);
        outParam.value = bound.value;
        setOutput([...output]);
    };
    const handleSubmit = (o) => {
        onChange({...o,  output: output})
    }
    
    return (
        <>
            {data?.options &&
                <Form
                    key={1}
                    initialValues={{output: output, endpoint: data.options?.endpoint}}
                    onSubmit={handleSubmit}
                    ignoreModified={true}
                    render={(formRenderProps) => (
                        <FormElement>
                            <fieldset className={"k-form-fieldset"}>
                                <legend className={"k-form-legend"}>Edit OPC UA parameters</legend>
                                <div className="mb-1" style={{display: 'flex', alignItems: 'end'}}>
                                    <Field name={"endpoint"} component={Input} label={"Endpoint address, URL"}/>
                                    <Button title="Connect" name="connect"
                                            icon="link"
                                            style={{marginLeft: 5}}
                                            type={'button'}
                                            onClick={() => setEndpoint(formRenderProps.valueGetter('endpoint'))}
                                    />
                                </div>
                                <div className="mb-1">
                                    <Field name={'output'}
                                           component={(fieldProps) =>
                                               <MultiSelect
                                                   {...fieldProps}
                                                   data={data.output?.map(el => ({text: el, profile: true}))}
                                                   onChange={(e) => {
                                                       setOutput(e.value);
                                                       fieldProps.onChange(e);
                                                   }}
                                                   textField='text'
                                                   dataItemKey='text'
                                                   allowCustom={true}
                                                   defaultValue={output}
                                                   tagRender={(tagProps, li) =>
                                                       React.cloneElement(li, {
                                                           ...li.props,
                                                           themeColor: tagProps.data[0].profile ? tagProps.data[0].value ? 'success' : 'base' : 'warning'
                                                       }, [
                                                           <span key={tagProps.text}
                                                                 title={tagProps.data[0].profile ? tagProps.data[0].value ? `Bound to ${tagProps.data[0].value}` : 'Not bound' : 'Not in profile'}
                                                                 onClick={(e) => {
                                                                     e.stopPropagation();
                                                                     e.preventDefault();
                                                                     setCard(tagProps.data[0].value ? {
                                                                         id: tagProps.data[0].value,
                                                                         param: tagProps.text
                                                                     } : null);
                                                                 }}
                                                           >{tagProps.text}</span>,
                                                           li.props.children
                                                       ])
                                                   }
                                               />
                                           }
                                           label='Output Parameters'
                                    />
                                </div>
                            </fieldset>
                            <div style={{paddingTop: '24px'}}>
                                <Button
                                    disabled={!formRenderProps.allowSubmit}
                                    themeColor={formRenderProps.allowSubmit ? 'primary' : 'secondary'}
                                    title='Save options'
                                    name='save'
                                    icon='save'
                                    type={'submit'}
                                >
                                    Save options
                                </Button>
                            </div>
                            <div className="mb-1">
                                <EndpointContext.Provider value={endpoint}>
                                    {endpoint &&
                                        <OpcParams onBind={bindOutput} output={output.map(o => o.text)}
                                                   setCard={(m) => setCard = m}/>
                                    }
                                </EndpointContext.Provider>
                            </div>
                        </FormElement>
                    )}
                />}
        </>
    );
}

