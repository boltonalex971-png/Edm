import React from 'react';

export const Sensor = ({ info, ...props }) => {
    return (
        <div
            {...props}
            style={{
                border: 'solid 1px lightgray',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gridTemplateRows: '50px 50px',
                alignItems: 'center',
                justifyItems: 'center'
            }}>
            <span style={{ gridColumn: '1/-1' }}><strong>#{props.addr}</strong> {info.Serial}</span>
            {['T', 'S', 'R', 'I'].map(i =>
                <span
                    key={`${props.key}${i}`}
                    className={(info[i]?.valid !== undefined && `bg-${(info[i].valid && 'success') || 'danger'} text-white`) || ''}
                    style={{ display: 'flex', width: '80%', justifyContent: 'center' }}
                    title={info[i]?.value}
                >{i}
                </span>
            )}
        </div>
    );
}   