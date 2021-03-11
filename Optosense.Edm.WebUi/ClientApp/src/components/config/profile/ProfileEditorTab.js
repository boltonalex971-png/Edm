import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { GridColumn } from '@progress/kendo-react-grid';
import { RelationTable } from '../../RelationTable';
import { dropDownCell } from '../../DropDownCell';
import { useGet } from '../../hooks/hooks';
import { DeviceDetail } from '../Devices';
import Api from '../../api';
import { useHistory } from 'react-router-dom';
import { Loading, LoadingContainer } from '../../utils/Utils';

ProfileEditorTab.propTypes = {
    id: PropTypes.number,
    api: PropTypes.string,
    onDetailSelected: PropTypes.func
}

export function ProfileEditorTab({ id, api, onDetailSelected }) {
    const [loading, setLoading] = useState(true);
    return (
        <div>
            <LoadingContainer loading={loading}>
                <iframe src={`/profiles/board/profile/${id}`} height='500' width='100%' seamless frameBorder='0' onLoad={() => setLoading(false)} />
            </LoadingContainer>
        </div>
    );
}

