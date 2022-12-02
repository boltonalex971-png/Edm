import React, { useContext, useState } from "react";
import PropTypes from "prop-types";
import { MasterDetail, Detail, Info } from "./MasterDetail";
import { useGet } from "./hooks";
import { ApiContext, EndpointContext } from "../Contexts";
import { Button } from "@progress/kendo-react-buttons";
import { DropDownList } from "@progress/kendo-react-dropdowns";

export function OpcParams({ onBind, output, setCard }) {
    const [param, setParam] = useState();
    setCard(setParam);

    return (
        <div style={{ margin: 10 }}>
            <h3>Available parameters</h3>
            <MasterDetail
                data={[]}
                stubMessage="Please select a parameter"
                onItemClick={setParam}
                detail={<ParamDetail param={param} output={output} onBind={onBind} />}
            />
        </div>

    );
}

ParamDetail.propTypes = {
    onBind: PropTypes.func,
    onChange: PropTypes.func,
    path: PropTypes.string,
    api: PropTypes.string,
    output: PropTypes.array,
    param: PropTypes.object,
};

export function ParamDetail({ param, output, onBind }) {
    const endpoint = useContext(EndpointContext);
    let search = { endpoint };
    if (param?.id) {
        search = { ...search, id: param.id };
    }
    const api = useContext(ApiContext);
    let [data, setData, loading, error] = useGet(`${api}/node`, search);
    const [selected, setSelected] = useState();
    const outputSelect = (e) => {
        setSelected(e.target.value);
    };
    const type = data?.value && Object.getOwnPropertyNames(data.value.Value.Value)[0];
    const field = type && Object.getOwnPropertyNames(data.value.Value.Value[type]).find(k => k !== '@xmlns');
    const value = field && data.value.Value.Value[type][field];

    return (
        <>
            {data?.displayName &&
                <Detail
                    key={(data.nodeId.Identifier)}
                    stub='Select parameter'
                    data={data}
                    loading={loading}
                    error={error}
                    card={
                        <Info
                            content={
                                <>
                                    <p>
                                        <strong>Node ID: </strong>{data.nodeId.Identifier}<br />
                                        <strong>Class: </strong>{data.nodeClass}
                                        <strong> of </strong>{type}
                                        <strong> at </strong>{data.value.sourceTimestamp}<br />
                                        <strong>Value: </strong>({type}) {JSON.stringify(value, null, ' ')}
                                    </p>
                                    <p>
                                        Profile parameter to bind:
                                        <DropDownList data={output}
                                            style={{ width: '200px', marginLeft: '2rem' }}
                                            value={param?.param || selected}
                                            onChange={outputSelect} />
                                        <Button icon='link' type={'button'}
                                            title='Bind to output parameter'
                                            style={{ marginLeft: '2rem' }}
                                            themeColor='primary'
                                            onClick={() => onBind({ text: selected, value: data.nodeId.Identifier })}>Bind</Button>
                                        {/* <Button icon='unlink' type={'button'}
                                    disabled={output.find(el => el.value === data.name)}
                                    title='Unbind parameter'
                                    style={{ marginLeft: '0.5rem' }}
                                    themeColor='base'
                                    onClick={() => onBind({ text: null, value: data.name })}>Unbind</Button> */}
                                    </p>
                                </>
                            }
                        />
                    }
                />
            }
        </>
    );
}
