import React, { useState } from "react";
import './Options.css';
import { Input, NumericTextBox } from "@progress/kendo-react-inputs";
import axios from "axios";
import { Button } from "@progress/kendo-react-buttons";
import { useLocation } from "react-router-dom";
import { Field, Form, FormElement } from '@progress/kendo-react-form';
import { DropDownList } from "@progress/kendo-react-dropdowns";

export const Options = ({ guid }) => {
    const location = useLocation();
    const search = new URLSearchParams(location.search);
    const [param] = useState(JSON.parse(atob(search.get('a'))), [location.search]);
    const optionsChange = (o) => {
        axios.put(`${param.api}`, o);
    };
    const BaudrateDropdown = compProps => <DropDownList data={[9600, 57600]} {...compProps} />;
    return (
        <Form
            key={1}
            initialValues={JSON.parse(param.options)}
            onSubmit={optionsChange}
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
                            title='Save'
                            name='save'
                            primary
                            icon='save'
                            type={'submit'}
                        >
                            Save
                        </Button>
                    </div>
                </FormElement>
            )}
        />
    );
}

