import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { GridColumn } from '@progress/kendo-react-grid';
import { EasyGrid } from './EasyGrid';
import { ColorPicker } from '@progress/kendo-react-inputs';
import { ComboBoxCell, DropDownCell } from './DropDownCell';
import axios from 'axios';

export function Config({ settings, setSettings, outputs }) {
    const { apiBase, operationId } = useOutletContext();
    const saveSettings = (s) => {
        axios.put(`${apiBase}/api/operations/${operationId}/settings`, s);
        setSettings(s)
    };
    const paramsChanged = (s) => {
        saveSettings({ ...settings, params: [...s] });
    };
    const colorsChanged = (name, color) => {
        settings.panels[name].color = color;
        saveSettings({ ...settings });
    };

    return (
        <div className='mt-2' style={{ width: '100%' }}>
            <div style={{ display: 'flex', width: '100%', margin: '1rem' }}>
                <div style={{ flex: 1 }}>
                    <p>Profile panel</p>
                    <ColorPicker name='profile'
                        defaultValue={settings.panels.profile.color}
                        onChange={(e) => colorsChanged('profile', e.value)}
                        size='medium'
                        view='gradient' />
                </div>
                <div style={{ flex: 1 }}>
                    <p>Main parameters</p>
                    <ColorPicker name='mainParams'
                        defaultValue={settings.panels.mainParams.color}
                        onChange={(e) => colorsChanged('mainParams', e.value)}
                        size='medium'
                        view='gradient' />
                </div>
                <div style={{ flex: 1 }}>
                    <p>Environment parameters</p>
                    <ColorPicker name='envParams'
                        defaultValue={settings.panels.envParams.color}
                        onChange={(e) => colorsChanged('envParams', e.value)}
                        size='medium'
                        view='gradient' />
                </div>
                <div style={{ flex: 1 }}>
                    <p>Other parameters</p>
                    <ColorPicker name='otherParams'
                        defaultValue={settings.panels.otherParams.color}
                        onChange={(e) => colorsChanged('otherParams', e.value)}
                        size='medium'
                        view='gradient' />
                </div>
            </div>
            <EasyGrid data={settings.params} //details={<div></div>}
                orderField='order'
                dataChange={paramsChanged}
            >
                <GridColumn field='order' title='Order' width={120} editor='numeric' />
                <GridColumn field='name' title='Name'
                    cell={(cellProps) =>
                        <ComboBoxCell {...cellProps} data={outputs} value={cellProps.dataItem.value} />
                    }
                />
                <GridColumn field='title' title='Title' />
                <GridColumn field='prefix' title='Prefix' />
                <GridColumn field='units' title='Units' />
                <GridColumn field='panel' title='Panel' width={150} editable={true}
                    cell={(cellProps) =>
                        <DropDownCell {...cellProps}
                            getData={() => Object.keys(settings.panels).filter(k => k !== 'profile').map(k => ({ name: k }))}
                            id='name'
                            text='name'
                            fieldName='panel'
                        />
                    }
                />
            </EasyGrid>
        </div>
    );
}
