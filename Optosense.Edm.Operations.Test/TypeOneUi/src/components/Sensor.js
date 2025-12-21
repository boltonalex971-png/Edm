export const Sensor = ({ info, settings, key, addr}) => {
    const broken = Object.entries(info).some(e => e[1]?.valid === false)
    const checked = Object.entries(info).filter(e => e[1]?.valid !== undefined)
    const good = checked.length === settings.indicators?.length && checked.every(e => e[1]?.valid === true)
    const completed = Object.entries(info).every(e => e[1]?.valid !== undefined)

    return (
        <div
            style={{
                border: completed ? 'solid 2px darkgray' : 'solid 1px lightgray',
                backgroundColor: broken ? '#ffe2e2' : good ? '#ddfad9' : 'inherit',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gridTemplateRows: '50px 50px',
                alignItems: 'center',
                justifyItems: 'center'
            }}>
            <span style={{ gridColumn: '1/-1' }}>#{addr + 1} <strong>{info.serial}</strong></span>
            {settings?.indicators && settings.indicators.sort((a, b) => a.order - b.order)
                .map(i =>
                    <span
                        key={`${key}${i.indicator}`}
                        className={(info[i.parameter]?.valid !== undefined && `bg-${(info[i.parameter].valid && 'success') || 'danger'} text-white`) || ''}
                        style={{ display: 'flex', width: '80%', justifyContent: 'center' }}
                        title={`${i.title || i.indicator} ${info[i.parameter]?.value || ''}`}
                    >{i.indicator}
                    </span>
                )}
        </div>
    );
}   