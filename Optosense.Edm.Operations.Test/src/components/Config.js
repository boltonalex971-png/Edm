import React from 'react';
import { useGet } from './hooks/hooks';

export function Config({ apiBase }) {
    const [[data]] = useGet(`${apiBase}/apps/test/WeatherForecast`);
    return (
        <div>
            <p>
                Below you can the result of operation controller call
            </p>
            <textarea
                className='form-control'
                style={{ width: '100%' }}
                readOnly
                type='textarea'
                rows={10}
                value={data || "Empty"}
            />
        </div>
    );
}