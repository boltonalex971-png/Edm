import React, { useContext, useState } from "react";
import './Instructions.css';
import PropTypes from "prop-types";
import { Field } from "@progress/kendo-react-form";
import { Input, NumericTextBox, Checkbox } from "@progress/kendo-react-inputs";
import { MasterDetail, Detail, Editor } from "../MasterDetail";
import { useGet } from "../hooks";
import { ApiContext } from "../../ApiContext";
import axios from "axios";
import { Button } from "@progress/kendo-react-buttons";
import { useHistory, Link } from "react-router-dom";

export function Instructions({ guid }) {
    const history = useHistory();
    const api = useContext(ApiContext);
    const [data, setData, loading, error] = useGet(`${api}/technologies/plugins/${process.env.REACT_APP_GUID}/instructions`);
    const [instruction, setInstruction] = useState();
    const saveInstruction = (inst) => {
        let changedData = [...((data || []).filter(item => item.name !== inst.name))];
        let newInst;
        if (!inst.deleted) {
            newInst = { ...inst };
            changedData = [newInst, ...changedData];
        }

        setInstruction(newInst);
        setData(changedData);
        axios.put(`${api}/technologies/plugins/${process.env.REACT_APP_GUID}/instructions`, changedData);
    };
    return (
        <div style={{ margin: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem'  }}>
                <h6>Board Profile Configuration</h6>
                {/*<Button type='button' onClick={() => history.goBack()}>Go back to editor</Button>*/}
                <Link onClick={() => history.goBack()} className='btn btn-light'>Go back to editor</Link>
            </div>
            <MasterDetail
                data={data}
                loading={loading}
                error={error}
                stubMessage="Please select an instruction"
                onItemClick={setInstruction}
                detail={<InstructionDetail instruction={instruction} onChange={saveInstruction} />}
            />
        </div>

    );
}

InstructionDetail.propTypes = {
    onChange: PropTypes.func,
    path: PropTypes.string,
    api: PropTypes.string,
    instruction: PropTypes.object,
};

export function InstructionDetail({ instruction, ...props }) {
    return (
        <Detail
            {...props}
            key={(instruction && instruction.name) || ''}
            stub='Select instruction'
            data={instruction}
            card={
                <Editor
                    {...props}
                    data={instruction}
                    setData={props.onChange}
                    content={
                        <fieldset className={"k-form-fieldset"}>
                            <legend className={"k-form-legend"}>Edit instruction data</legend>
                            <div className="mb-1">
                                <Field name={"name"} component={Input} label={"Name"} />
                            </div>
                            <div className="mb-1">
                                <Field name={"description"} component={Input} label={"Description"} />
                            </div>
                            <div className="mb-1">
                                <Field name={"code"} component={Input} label={"Code"} />
                            </div>
                            <div className="mb-1">
                                <Field name={"syntax"} component={Input} label={"Syntax template"} />
                            </div>
                            <div className="my-3">
                                <Field name={"multiLineResponse"} component={Checkbox} label={"Multiline response"} />
                            </div>
                            <div className="mb-1">
                                <Field name={"length"} component={NumericTextBox} label={"Response length"} />
                            </div>
                            <div className="mb-1">
                                <Field name={"timeout"} component={NumericTextBox} label={"Timeout"} />
                            </div>
                            <div className="mb-1">
                                <Field name={"retries"} component={NumericTextBox} label={"Retries on timeout"} />
                            </div>
                        </fieldset>
                    }
                />
            }
        />
    );
}
