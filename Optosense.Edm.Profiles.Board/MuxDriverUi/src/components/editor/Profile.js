import React, { useContext } from 'react';
import { useRouteMatch, Link } from 'react-router-dom';
import { Alert } from 'reactstrap';
import { ApiContext } from '../../ApiContext';
import { useGet } from '../hooks';
import { DropDownCell } from '../DropDownCell';
import { GridColumn } from '@progress/kendo-react-grid';
import { EasyGrid } from './EasyGrid';
import axios from 'axios';

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
        return (
            <EasyGrid data={props.dataItem.instructions || []} style={{ width: '75%' }} orderField='order' dataChange={dataChange}>
                <GridColumn field='order' title='Order' width={150} editor='numeric' />
                <GridColumn field='name' title='Instruction' width={200} editable={true}
                    cell={(p) => DropDownCell({ key: 'name', text: 'name', data: instructions, editField: 'edit', ...p })}
                />
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h6>Profile {profile.name}</h6>
                        <Link to='/config' className='btn btn-light'>Configure profile editor</Link>
                    </div>
                    <EasyGrid data={(profile.textJson && JSON.parse(profile.textJson)) || []} details={Details}
                        orderField='order'
                        dataChange={saveData}
                    >
                        <GridColumn field='order' title='Order' editor='numeric' width={150} />
                        <GridColumn field='command' title='Command' />
                        <GridColumn field='offset' title='Offset (min)' editor='numeric' width={150} />
                        <GridColumn field='duration' title='Duration (min)' editor='numeric' width={150} />
                    </EasyGrid>
                </div>
            }
        </>
    );
};

