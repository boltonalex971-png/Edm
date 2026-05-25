import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Detail } from '@microprojects/edm-components/components';
import { PluginContainer } from '@microprojects/react-utils';

HostConsole.propTypes = {
    id: PropTypes.string,
    data: PropTypes.object,
    onClose: PropTypes.func
}

export function HostConsole({ onClose, data }) {
    const { t } = useTranslation('tech');
    return (
        <Detail
            type='host'
            data={data}

            icon={<span className='bi bi-terminal' title={t('host.console')} />}
            card={
                <PluginContainer title={t('host.consoleTitle')}
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

