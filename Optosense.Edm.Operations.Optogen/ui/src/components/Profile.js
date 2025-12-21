export function Profile({ steps, params, profile }) {
    return (
        <div style={{ padding: '0.5rem', fontSize: '1rem' }}>
            {profile && profile.map((s, i) => {
                const isOffset = !isNaN(parseInt(s.condition));
                const style = steps.some(c => c === s.command) || params[s.command] ?
                    { fontWeight: 'bold', color: 'black' } :
                    { fontWeight: 'normal', color: 'gray' };
                return (
                    <p key={i} style={style}>
                        {i + 1}).&nbsp;
                        ({isOffset ? (s.condition === '0' ? 'immediately' : `in ${s.condition} s`) : `when ${s.condition}`})&nbsp;
                        {s.command}: {s.description} {s.repeat && `(every ${s.repeat} s)`}
                    </p>
                );
            })}
        </div>
    );
}