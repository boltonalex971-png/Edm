import React, {useState} from "react";
import {NumericTextBox, Input} from "@progress/kendo-react-inputs";
import axios from "axios";
import {Button} from "@progress/kendo-react-buttons";
import {useLocation} from "react-router-dom";
import {Field, Form, FormElement} from '@progress/kendo-react-form';

export const Options = ({guid, data, onChange}) => {
    const optionsChange = (o) => {
        onChange(o);
    };

    return (
        <>
            {data &&
                <Form
                    key={1}
                    initialValues={data.options}
                    onSubmit={optionsChange}
                    render={(formRenderProps) => (
                        <FormElement>
                            <fieldset className={"k-form-fieldset"}>
                                <legend className={"k-form-legend"}>Edit device options</legend>
                                <div className="mb-1" style={{width: 300}}>
                                    <Field name={"response"} component={NumericTextBox}
                                           label={"Max response time, in seconds"}/>
                                </div>
                                <div className="mb-1" style={{width: 300}}>
                                    <Field name={"input"} component={NumericTextBox}
                                           label={"Interval between data input, in seconds"}/>
                                </div>
                                <div className="mb-1" style={{width: 300}}>
                                    <Field name={"inputRequest"} component={Input} label={"Request for data input"}/>
                                </div>
                                <div className="mb-1" style={{width: 300}}>
                                    <Field name={"actionRequest"} component={Input} label={"Request for action"}/>
                                </div>
                            </fieldset>
                            <div className="k-form-buttons" style={{
                                position: 'sticky',
                                bottom: 10,
                                display: 'flex',
                                justifyContent: 'flex-start',
                                backgroundColor: 'white'
                            }}>
                                <Button
                                    title='Save'
                                    name='save'
                                    icon='save'
                                    type={'submit'}
                                    disabled={!formRenderProps.allowSubmit}
                                    themeColor={formRenderProps.allowSubmit ? 'primary' : 'secondary'}
                                >
                                    Save
                                </Button>
                            </div>
                        </FormElement>
                    )}
                />
            }
        </>
    );
}

