import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useGet } from '../hooks/hooks';
import { Field } from '@progress/kendo-react-form';
import { Input, NumericTextBox } from '@progress/kendo-react-inputs';
import { Button } from '@progress/kendo-react-buttons';
import { useHistory, useParams } from 'react-router-dom';
import { useRouteMatch } from 'react-router-dom';
import { MasterDetail, reloadMaster, Detail, Info, Editor } from '../MasterDetail';
import { HostTabs } from './host/HostTabs';
import Api from '../api';
import { HostConsole } from './host/HostConsole';

export function Hosts() {
    const history = useHistory();
    const { path } = useRouteMatch();
    const api = Api.hosts;
    return (
        <MasterDetail
            type='host'
            api={api}
            stubMessage='Please select a host'
            item={(props) =>
                <>
                    <span className={`k-icon k-i-${!props.item.isNode ? "inherited" : props.item.expanded ? "folder-open" : "folder"}`}>&nbsp;</span>
                    {!props.item.isNode &&
                        <span className={`k-icon k-i-circle text-${props.item.isActive ? "success" : "danger"}`}>&nbsp;</span>
                    }
                    <span>{props.item.name}</span>
                </>
            }
            detail={(
                <HostDetail
                    api={api}
                    path={path}
                    onChange={() => reloadMaster()}
                    onClose={() => history.push(path)}
                />
            )}
        />
    );
}

HostDetail.propTypes = {
    onChange: PropTypes.func,
    path: PropTypes.string,
    api: PropTypes.string,
    hostId: PropTypes.number,
    type: PropTypes.string
}

export function HostDetail({ hostId, ...props }) {
    let { id } = useParams();
    id = hostId || parseInt(id);
    let [sub, setSub] = useState();
    useEffect(setSub, [id]);
    let [[data, setData], loading, error] = useGet(`${props.api}/${id}`, [id]);
    if (!data || data.id === 0) {
        data = { ...data, name: '', description: '', url: '' };
    }
    return (
        <Detail {...props}
            id={id}
            icon={<span className='k-icon k-i-inherited' title='Host' />}
            loading={loading}
            error={error}
            data={data}
            subDetail={sub}
            card={
                <>
                    <div className="d-flex justify-content-left align-items-baseline" >
                        <span className={`me-2 k-icon k-i-circle text-${data.isActive ? 'success' : 'danger'}`} ></span>
                        <Info {...props}
                            data={data}
                            content={
                                <div className='me-2' >
                                    <p>{`${data.url}:${data.port}`} v{data.version}</p>
                                </div>
                            }
                        />
                        <Button className='me-2' disabled={data.isActive === false}
                            onClick={() => setSub(
                                <HostConsole
                                    data={data}
                                    onClose={() => setSub()}
                                />)
                            } >
                            <span className='k-icon k-i-toggle-full-screen-mode me-2'></span>
                            <span>
                                Console
                            </span>
                        </Button>
                    </div>
                </>
            }
            editor={
                <Editor {...props}
                    type='host'
                    data={data}
                    setData={setData}
                    content={
                        <fieldset className={'k-form-fieldset'}>
                            <legend className={'k-form-legend'}>Edit host data</legend>
                            <div className="mb-3">
                                <Field name={'name'} component={Input} label={'Name'} />
                            </div>
                            <div className="mb-3">
                                <Field name={'description'} component={Input} label={'Description'} />
                            </div>
                            <div className="mb-3">
                                <Field name={'port'} component={NumericTextBox} label={'Port'} />
                            </div>
                            <div className="mb-3">
                                <Field name={'url'} component={Input} label={'Address'} />
                            </div>
                        </fieldset>
                    }
                />
            }
            relations={
                <HostTabs id={parseInt(id)} api={props.api} onDetailSelected={setSub} />
            }
        />
    );
}

