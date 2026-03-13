import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useGet } from '../../hooks/hooks';
import { MasterDetail, reloadMaster, Detail, Info, Editor } from '../../MasterDetail';
import { ProcessWorkbenchesTab } from './ProcessWorkbenchesTab';
import { Handyman as WorkbenchIcon } from '@mui/icons-material';


ProcessWorkbenchesDetail.propTypes = {
    onChange: PropTypes.func,
    path: PropTypes.string,
    api: PropTypes.string,
    workplaceProcessId: PropTypes.number
}

export function ProcessWorkbenchesDetail({ workplaceProcessId, parents, ...props }) {
    const type = 'workbench';
    const id = workplaceProcessId;
    let [sub, setSub] = useState();
    useEffect(setSub, [id]);
    let [[data, setData], loading, error] = useGet(`${props.api}/${id}`, [id]);
    data = !data || data.id === 0 ?
        { ...data, name: '', description: '', url: '' } :
        { ...data, name: `Workbenches`, description: `For ${data.processName} on ${data.workplaceName}` };
    return (
        <Detail {...props}
            type={type}
            icon={<WorkbenchIcon />}
            data={data}
            parents={parents}

            subDetail={sub}
            card={
                <ProcessWorkbenchesTab id={parseInt(id)} api={props.api} onDetailSelected={setSub} parents={[...(parents || []), { name: data.name, icon: <WorkbenchIcon />, ref: { current: null } }]} />
            }
        />
    );
}
