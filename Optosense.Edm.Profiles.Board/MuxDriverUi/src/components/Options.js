import React, { useState } from "react";
import './Options.css';
import { Input, NumericTextBox } from "@progress/kendo-react-inputs";
import axios from "axios";
import { Button } from "@progress/kendo-react-buttons";
import { Field, Form, FormElement } from '@progress/kendo-react-form';
import { DropDownList } from "@progress/kendo-react-dropdowns";

export const Options = ({ data, changeOptions }) => {
    const [param] = useState(data);
    const BaudrateDropdown = compProps => <DropDownList data={[9600, 57600]} {...compProps} />;
    return (
        <Form
            key={1}
            initialValues={param?.options}
            onSubmit={changeOptions}
            render={(formRenderProps) => (
                <FormElement>
                    <fieldset className={"k-form-fieldset"}>
                        <legend className={"k-form-legend"}>Edit device options</legend>
                        <div className="mb-1" style={{ width: 200 }}>
                            <Field name={"port"} component={Input} label={"Port"} />
                        </div>
                        <div className="mb-1" style={{ width: 200 }}>
                            <Field name={"baudrate"} component={BaudrateDropdown} label={"Baudrate"} />
                        </div>
                        <div className="mb-1" style={{ width: 200 }}>
                            <Field name={"capacity"} component={NumericTextBox} label={"Board capacity"} />
                        </div>
                    </fieldset>
                    <div className="k-form-buttons" style={{ position: 'sticky', bottom: 10, display: 'flex', justifyContent: 'flex-start', backgroundColor: 'white' }}>
                        <Button
                            disabled={!formRenderProps.allowSubmit}
                            title='Save options'
                            name='save'
                            primary={formRenderProps.allowSubmit}
                            icon='save'
                            type={'submit'}
                        >
                            Accept
                        </Button>
                    </div>
                </FormElement>
            )}
        />
    );
}

