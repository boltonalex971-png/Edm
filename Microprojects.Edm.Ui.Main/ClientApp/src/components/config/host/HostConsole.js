import PropTypes from 'prop-types';
import { Detail } from '../../MasterDetail';
import { PluginContainer } from '@microprojects/react-utils';

HostConsole.propTypes = {
    id: PropTypes.number,
    data: PropTypes.object,
    onClose: PropTypes.func
}

export function HostConsole({ onClose, data }) {
    return (
        <Detail
            data={data}
            icon={<span className='bi bi-terminal' title='Console' />}
            card={
                <PluginContainer title='Host Console'
                    data={{}}
                    src={`${data.url}:${data.uiPort}/console`}
                    height='500'
                    width='100%'
                />
            }
            onClose={onClose}
        />

    );
}

