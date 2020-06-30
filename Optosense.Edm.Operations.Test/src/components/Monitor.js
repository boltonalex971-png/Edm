import React, { useEffect, useRef } from 'react';
import { useState } from 'react';
import { useGet } from './hooks/hooks';

let monitorInterval;

export function Monitor({ operationId, apiBase, started }) {
    const inputRef = useRef();
    const [scrolled, setScrolled] = useState(false);
    const [lastId, setLastId] = useState(0);
    const [cache, setCache] = useState([]);
    const [refresh, setRefresh] = useState(false);
    const [[data, setData]] = useGet(`${apiBase}/api/operations/${operationId}/records?lastRecordId=${lastId}`, refresh);
    if (data && data.length > 0) {
        setLastId(data.reduce((max, el) => el.id > max ? el.id : max, 0));
        setCache([...cache, ...data.map(r => `Req:<${r.request}> Resp:<${r.response}>`)]);
        setData([]);
    }

    useEffect(() => {
        if (started) {
            monitorInterval = setInterval(() => setRefresh(r => !r), 1000);
        } else {
            clearInterval(monitorInterval);
        }

        return () => clearInterval(monitorInterval);
    }, [started]);
    useEffect(() => {
        if (!scrolled) {
            inputRef.current.scrollTop = inputRef.current.scrollHeight;
        }
    });
    return (
        <div>
            <p>
                Below you can see progress of operation execution in real time.
            </p>
            <strong>{cache.length} records received</strong>
            <textarea
                className='form-control'
                style={{ width: '100%' }}
                onScroll={(e) => setScrolled(e.target.scrollHeight >= e.target.scrollTop + e.target.getBoundingClientRect().y + 10)}
                ref={inputRef}
                readOnly
                type='textarea'
                rows={10}
                value={cache.join('\n')}
            />
        </div>
    );
}