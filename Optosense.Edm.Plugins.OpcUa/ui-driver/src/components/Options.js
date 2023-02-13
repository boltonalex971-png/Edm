import React, { useState } from "react";
import { Input } from "@progress/kendo-react-inputs";
import axios from "axios";
import { Button, Chip, ChipList } from "@progress/kendo-react-buttons";
import { useLocation } from "react-router-dom";
import { Field, Form, FormElement } from '@progress/kendo-react-form';
import { MultiSelect } from "@progress/kendo-react-dropdowns";
import { OpcParams } from "./OpcParams";
import { EndpointContext } from "../Contexts";

let setCard;

export const Options = ({ guid }) => {
    const location = useLocation();
    const search = new URLSearchParams(location.search);
    const [param] = useState(JSON.parse(search.get('a')), [location.search]);
    const [output, setOutput] = useState(
        (param.output || [])
            .map(el => ({ text: el, value: (param.options || []).output.find(p => p.text === el)?.value || null })),
        [location.search]);
    const [endpoint, setEndpoint] = useState(param.options?.endpoint);
    const handleSubmit = (o) => {
        axios.put(`${param.api}`, o);
    };
    const onOutputBind = (bound) => {
        const outParam = output.find(p => p.text === bound.text);
        outParam.value = bound.value;
        setOutput([...output]);
    };

    return (
        <Form
            key={1}
            initialValues={{ output: output, endpoint: param.options.endpoint }}
            onSubmit={handleSubmit}
            render={(formRenderProps) => (
                <FormElement>
                    <fieldset className={"k-form-fieldset"}>
                        <legend className={"k-form-legend"}>Edit OPC UA parameters</legend>
                        <div className="mb-1" style={{ display: 'flex', alignItems: 'end' }}>
                            <Field name={"endpoint"} component={Input} label={"Endpoint address, URL"} />
                            <Button title="Connect" name="connect"
                                icon="link"
                                style={{ marginLeft: 5 }}
                                type={'button'}
                                onClick={() => setEndpoint(formRenderProps.valueGetter('endpoint'))}
                            />
                        </div>
                        <div className="mb-1" >
                            <Field name={'output'}
                                component={(fieldProps) =>
                                    <MultiSelect {...fieldProps}
                                        data={param.output.filter(o => !output.some(a => a.text === o)).map(el => ({ text: el }))}
                                        onChange={(e) => {
                                            setOutput(e.value);
                                            fieldProps.onChange(e);
                                        }}
                                        textField='text'
                                        allowCustom={true}
                                        value={output}//{JSON.parse(fieldProps.value || '[]')}
                                        tagRender={(tagProps, li) =>
                                            React.cloneElement(li, { ...li.props, themeColor: tagProps.data[0].value ? 'success' : 'base' }, [
                                                <span key={tagProps.text}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        setCard(tagProps.data[0].value ? { id: tagProps.data[0].value, param: tagProps.text } : null);
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
                    <div style={{ paddingTop: '24px' }}>
                        <Button
                            className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-base"
                            title='Save options'
                            name='save'
                            themeColor='primary'
                            icon='save'
                            type={'submit'}
                            disabled={!formRenderProps.allowSubmit}
                        >
                            Save options
                        </Button>
                    </div>
                    <div className="mb-1" >
                        <EndpointContext.Provider value={endpoint}>
                            {endpoint &&
                                <OpcParams onBind={onOutputBind} output={output.map(o => o.text)} setCard={(m) => setCard = m} />
                            }
                        </EndpointContext.Provider>
                    </div>
                </FormElement >
            )}
        />
    );
}

