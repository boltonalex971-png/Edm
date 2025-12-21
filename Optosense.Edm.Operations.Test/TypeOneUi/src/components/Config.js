import React from 'react';
import { EasyGrid } from './EasyGrid';
import { ComboBoxCell } from './DropDownCell';
import { GridColumn } from '@progress/kendo-react-grid';
import { ComboBox } from '@progress/kendo-react-dropdowns';

export function Config({ settings, outputs, onSettingsChanged }) {
    const serialChanged = (e) => {
        onSettingsChanged({ ...settings, serial: e.value })
    }
    const indicatorsChanged = (i) => {
        onSettingsChanged({ ...settings, indicators: i })
    }

    return (
        <div>
            <h3 style={{ margin: '1rem' }}>Serial No Parameter</h3>

            <ComboBox
                style={{ width: '400px' }}
                data={outputs}
                value={settings.serial}
                title='SerialNo indicator'
                onChange={serialChanged}
            />
            <h3 style={{ margin: '1rem' }}>Sensor indicators</h3>
            <EasyGrid data={settings?.indicators || []}
                orderField='order'
                dataChange={indicatorsChanged}
            >
                <GridColumn field='order' title='Order' width={120} editor='numeric' />
                <GridColumn field='indicator' title='Indicator' />
                <GridColumn field='parameter' title='Parameter'
                    cell={(cellProps) =>
                        <ComboBoxCell {...cellProps} data={outputs} value={cellProps.dataItem.value} />
                    }
                />
                <GridColumn field='title' title='Title' />
            </EasyGrid>

        </div>
    );
}