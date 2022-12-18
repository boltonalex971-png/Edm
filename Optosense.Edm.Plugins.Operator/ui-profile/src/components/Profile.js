import React, { useContext, useState } from 'react';
import { useMatch, useParams } from 'react-router-dom';
import { Alert } from 'reactstrap';
import { ApiContext } from '../ApiContext';
import { useGet } from './hooks';
import { GridColumn } from '@progress/kendo-react-grid';
import { EasyGrid } from './EasyGrid';
import axios from 'axios';
import { ChipList } from '@progress/kendo-react-buttons';
import { DropDownCell } from './DropDownCell';
import { MultiSelect } from '@progress/kendo-react-dropdowns';

export const Profile = (props) => {
    const { id } = useParams();
    const [actions] = useState([{ name: 'Get' }, { name: 'Set' }]);
    const api = useContext(ApiContext);
    const [profile, , loading, error] = useGet(`${api}/profiles/${id}`, []);
    const saveData = (data) => {
        axios.put(`${api}/profiles/${id}`, { ...profile, textJson: JSON.stringify(data) });
    };

    return (
        <>
            {loading && <h6>Loading profile...</h6>}
            {error && <Alert color='red'>{error}</Alert>}
            {profile &&
                <div style={{ margin: 10 }}>
                    <EasyGrid data={(profile.textJson && JSON.parse(profile.textJson)) || []} details={StepDetail}
                        orderField='order'
                        dataChange={saveData}
                    >
                        <GridColumn field='order' title='Order' editor='numeric' width={150} />
                        <GridColumn field='condition' title='Condition' width={150} />
                        <GridColumn field='command' title='Command' />
                        <GridColumn field='description' title='Description' />
                        <GridColumn field='responseTime' title='Response Time, s' editor='numeric' width={150} />
                        <GridColumn field='repeat' title='Repeat every, s' editor='numeric' width={150} />
                        {/* <GridColumn field='action' title='Operator Action' width={150} editable={true}
                            cell={(cellProps) =>
                                <DropDownCell {...cellProps}
                                    getData={() => actions}
                                    id='name'
                                    text='name'
                                    fieldName='action'
                                    fieldId='action'
                                />
                            }
                        /> */}
                        <GridColumn field='parameters' title='Output params' width={200}
                            cell={(cellProps) =>
                                <>
                                    {!cellProps.dataItem.inEdit &&
                                        <td>
                                            <ChipList {...cellProps} disabled={true}
                                                data={JSON.parse(cellProps.dataItem[cellProps.field] || '[]').map((el => ({ text: el, value: el })))}
                                            />
                                        </td>
                                    }
                                    {cellProps.dataItem.inEdit &&
                                        <MultiSelect {...cellProps}
                                            allowCustom={true}
                                            value={JSON.parse(cellProps.dataItem[cellProps.field] || '[]')}
                                            onChange={(e) => cellProps.onChange({
                                                dataItem: cellProps.dataItem,
                                                field: cellProps.field,
                                                syntheticEvent: e.syntheticEvent,
                                                value: JSON.stringify(e.value)
                                            })}
                                        />
                                    }

                                </>
                            }
                        />
                    </EasyGrid>
                </div>
            }
        </>
    );
};

const StepDetail = (props) => {
    const inst = props.dataItem;
    return (
        <div>
            <p>
                <strong>{inst.command}</strong> when <strong>{inst.condition}</strong> during <strong>{inst.responseTime} sec</strong>
                <br /><br />{inst.description}
            </p>
        </div >
    );
};

