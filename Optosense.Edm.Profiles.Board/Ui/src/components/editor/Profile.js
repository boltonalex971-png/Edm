import React, { useContext } from 'react';
import { useRouteMatch, Link } from 'react-router-dom';
import { Alert } from 'reactstrap';
import { ApiContext } from '../../ApiContext';
import { useGet } from '../hooks';
import { DropDownCell } from '../DropDownCell';
import { Field } from "@progress/kendo-react-form";
import { Input, NumericTextBox } from "@progress/kendo-react-inputs";
import { GridColumn } from '@progress/kendo-react-grid';
import { EasyGrid } from './EasyGrid';
import axios from 'axios';
import { Editor } from '../MasterDetail';

export const Profile = (props) => {
    const match = useRouteMatch();
    const api = useContext(ApiContext);
    const [profile, , loading, error] = useGet(`${api}/profiles/${match.params.id}`, []);
    const [instructions] = useGet(`${api}/plugins/${process.env.REACT_APP_GUID}/instructions`, []);
    const saveData = (data) => {
        axios.put(`${api}/profiles/${match.params.id}`, { ...profile, textJson: JSON.stringify(data) });
    };
    const Details = (props) => {
        const dataChange = (data) => {
            props.dataItem.instructions = data;
            props.dataChanged(props.dataItem);
        };
        const instructionChanged = data => {
            data.dataItem.instruction = instructions.find(i => i.name === data.value);
        };
        return (
            <EasyGrid data={props.dataItem.instructions || []}
                details={InstructionDetail}
                style={{ width: '90%' }} orderField='order' dataChange={dataChange}
            >
                <GridColumn field='order' title='Order' width={150} editor='numeric' />
                <GridColumn field='name' title='Instruction' width={200} editable={true}
                    cell={(p) => DropDownCell({ ...p, key: 'name', text: 'name', data: instructions, editField: 'edit', dataChange: instructionChanged })}
                />
                <GridColumn field='offset' title='Offset (ms)' width={150} editor='numeric' />
                <GridColumn field='gap' title='Gap (ms)' width={150} editor='numeric' />
                <GridColumn field='args' title='Arguments' />
            </EasyGrid>
        );
    };

    return (
        <>
            {loading && <h6>Loading profile...</h6>}
            {error && <Alert color='red'>{error}</Alert>}
            {profile &&
                <div style={{ margin: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' , marginBottom: '1rem' }}>
                        <h6>Profile {profile.name}</h6>
                        <Link to='/config' className='btn btn-light'>Configure profile editor</Link>
                    </div>
                    <EasyGrid data={(profile.textJson && JSON.parse(profile.textJson)) || []} details={Details}
                        orderField='order'
                        dataChange={saveData}
                    >
                        <GridColumn field='order' title='Order' editor='numeric' width={150} />
                        <GridColumn field='command' title='Command' />
                        <GridColumn field='offset' title='Offset (ms)' editor='numeric' width={150} />
                        <GridColumn field='duration' title='Duration (min)' editor='numeric' width={150} />
                    </EasyGrid>
                </div>
            }
        </>
    );
};
const InstructionDetail = (props) => {
    const inst = props.dataItem.instruction;
    return (
        <div>
            <p>
                <strong>{inst.name}</strong>{inst.description && `, ${inst.description}`}
            </p>
            <p style={{ display: 'grid', gridTemplateColumns: '5rem auto' }}>
                <span>Code:</span><span>{inst.code}</span>
                <span>Syntax:</span><span>{inst.syntax}</span>
                <span>Response:</span><span>{inst.multiLineResponse ? 'Multi' : 'Single'} line</span>
                <span>Timeout:</span><span>{inst.timeout}</span>
                <span>Retries:</span><span>{inst.retries}</span>
            </p>
        </div>
    );
};

