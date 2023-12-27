import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Window } from '@progress/kendo-react-dialogs';
import { ComboBox } from '@progress/kendo-react-dropdowns';
import { Button } from '@progress/kendo-react-buttons';
import { NumericTextBox, Input } from '@progress/kendo-react-inputs';
import { useGet } from '../../hooks/hooks';

ZoneEditor.propTypes = {
    data: PropTypes.object,
    onSave: PropTypes.func,
    onDelete: PropTypes.func,
    onClose: PropTypes.func
}

export function ZoneEditor(props) {
    const [fields, setFields] = useState(props.data);
    return (
        <Window title='Zone' style={{ position: "fixed" }}
            width={250}
            height={360}
            modal={true}
            maximizeButton={() => null}
            minimizeButton={() => null}
            onClose={props.onClose}
        >
            <form className="k-form">
                <input type='hidden' readOnly name='id' value={props.data.id} />
                <Input
                    label='Zone #'
                    value={fields.no}
                    onChange={(e) => setFields({ ...fields, no: e.value })}
                />
                <Input
                    label='Active When'
                    value={fields.activeWhen}
                    onChange={(e) => setFields({ ...fields, activeWhen: e.value })}
                />
                <NumericTextBox className='k-textbox'
                    label='Offset (min)'
                    value={fields.offset}
                    onChange={(e) => setFields({ ...fields, offset: e.value })}
                />
                <NumericTextBox className='k-textbox'
                    label='Duration (min)'
                    value={fields.duration}
                    onChange={(e) => setFields({ ...fields, duration: e.value })}
                />
                <div className="text-right mt-4">
                    {fields.id &&
                        <Button type='button' onClick={(e) => { e.preventDefault(); props.onDelete(fields); }}>Delete</Button>
                    }
                    <Button type='submit' className="k-primary ml-2" onClick={(e) => { e.preventDefault(); props.onSave(fields); }}>Save</Button>
                </div>
            </form>
        </Window>
    );
}

CriterionEditor.propTypes = {
    data: PropTypes.object,
    functions: PropTypes.array,
    params: PropTypes.array,
    onSave: PropTypes.func,
    onDelete: PropTypes.func,
    onClose: PropTypes.func
}

export function CriterionEditor(props) {
    const [fields, setFields] = useState(props.data);
    const selectedFunc = props.functions.filter(f => f.name === fields.function)[0];
    return (
        <Window title='Criterion' style={{ position: "fixed" }}
            width={250}
            height={490}
            modal={true}
            maximizeButton={() => null}
            minimizeButton={() => null}
            onClose={props.onClose}
        >
            <form className="k-form">
                <input type='hidden' readOnly name='zoneId' value={props.data.zoneId} />
                <input type='hidden' readOnly name='id' value={props.data.id} />
                <ComboBox label="Parameter" value={fields.param}
                    data={props.params}
                    onChange={(e) => setFields({ ...fields, param: e.value })}
                />
                <ComboBox label="Function" value={fields.function}
                    data={props.functions.map(f => f.name)}
                    onChange={(e) => setFields({ ...fields, function: e.value })}
                />
                <fieldset className={'k-form-fieldset'}>
                    <legend className={'k-form-legend'}>Arguments</legend>
                    {(selectedFunc && selectedFunc.args && selectedFunc.args[0]) &&
                        <Input autoFocus={true}
                            label={`${selectedFunc.args[0].name}, ${selectedFunc.args[0].type}`}
                            value={fields.arg1}
                            onChange={(e) => setFields({ ...fields, arg1: e.value })}
                        />
                    }
                    {(selectedFunc && selectedFunc.args && selectedFunc.args[1]) &&
                        <Input
                            label={`${selectedFunc.args[1].name}, ${selectedFunc.args[1].type}`}
                            value={fields.arg2}
                            onChange={(e) => setFields({ ...fields, arg2: e.value })}
                        />
                    }
                </fieldset>
                <div className="text-right mt-4">
                    {fields.id &&
                        <Button type='button' onClick={(e) => { e.preventDefault(); props.onDelete(fields); }}>Delete</Button>
                    }
                    <Button type='submit' className="k-primary ml-2" onClick={(e) => { e.preventDefault(); props.onSave(fields); }}>Save</Button>
                </div>
            </form>
        </Window>
    );
}

