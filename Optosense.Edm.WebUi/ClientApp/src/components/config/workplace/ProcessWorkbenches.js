import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useGet } from '../../hooks/hooks';
import { Field } from '@progress/kendo-react-form';
import { Input, NumericTextBox } from '@progress/kendo-react-inputs';
import { useHistory, useParams } from 'react-router-dom';
import { useRouteMatch } from 'react-router-dom';
import { MasterDetail, reloadMaster, Detail, Info, Editor } from '../../MasterDetail';
import { TabStrip, TabStripTab } from '@progress/kendo-react-layout';
import { ProcessWorkbenchesTab } from './ProcessWorkbenchesTab';

ProcessWorkbenchesDetail.propTypes = {
    onChange: PropTypes.func,
    path: PropTypes.string,
    api: PropTypes.string,
    workplaceProcessId: PropTypes.number
}

export function ProcessWorkbenchesDetail({ workplaceProcessId, ...props }) {
    const id = workplaceProcessId;
    let [sub, setSub] = useState();
    useEffect(setSub, [id]);
    let [[data, setData], loading, error] = useGet(`${props.api}/${id}`, [id]);
    data = !data || data.id === 0 ?
        { ...data, name: '', description: '', url: '' } :
        { ...data, name: `Workbenches`, description: `For ${data.processName} on ${data.workplaceName}` };
    return (
        <Detail {...props}
            data={data}
            subDetail={sub}
            card={
                <ProcessWorkbenchesTab id={parseInt(id)} api={props.api} onDetailSelected={setSub} />
            }
        />
    );
}

