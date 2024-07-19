import React, { useState } from "react";
import './Options.css';
import { Input, NumericTextBox } from "@progress/kendo-react-inputs";
import { Button } from "@progress/kendo-react-buttons";
import { Field, Form, FormElement } from '@progress/kendo-react-form';

export const Options = ({ options, changeOptions }) => {
    return (
        <Form
            key={1}
            initialValues={options || {}}
            onSubmit={changeOptions}
            render={(formProps) =>
                <FormElement>
                    <fieldset className={"k-form-fieldset"}>
                        <legend className={"k-form-legend"}>Edit device options</legend>
                        <div className="mb-1" style={{ width: 400 }}>
                            <Field name={"baseUrl"} component={Input} label={"Base URL"} />
                        </div>
                        <div className="mb-1" style={{ width: 400 }}>
                            <Field name={"contentType"} component={Input} label={"Content Type"} />
                        </div>
                        <div className="mb-1">
                            <Field name={"token"} component={Input} label={"Security Token"} />
                        </div>
                        <div style={{ border: '1px solid black', padding: '1rem', marginTop: '1rem', backgroundColor: 'pink' }}>
                            <span>WARNING: This option for technologists only!</span>
                            <div className="mb-1" style={{ width: 200 }}>
                                <Field name={"initialSerialNo"} component={NumericTextBox} label={"Initial serial number"} />
                            </div>
                        </div>
                    </fieldset>
                    <div className="k-form-buttons" style={{ position: 'sticky', bottom: 10, display: 'flex', justifyContent: 'flex-start', backgroundColor: 'white' }}>
                        <Button
                            disabled={!formProps.allowSubmit}
                            title='Save options'
                            name='save'
                            themeColor={formProps.allowSubmit ? 'primary' : 'base'}
                            icon='save'
                            type={'submit'}
                        >
                            Accept
                        </Button>
                    </div>
                </FormElement>
            }
        />
    );
}

