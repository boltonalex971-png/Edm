import React, {useEffect, useRef} from 'react';
import {useState} from 'react';
import {Grid, GridColumn} from "@progress/kendo-react-grid";


export function Log({records}) {
    const inputRef = useRef();
    const [scrolled, setScrolled] = useState(false);
    const setScroll = (e) => {
        const scroll = e.target.scrollHeight >= e.target.scrollTop + e.target.getBoundingClientRect().y + 10;
        setScrolled(scroll);
    };
    useEffect(() => {
        // TODO need to separate handle scroll from below one
        //if (!scrolled) {
        //inputRef.current.scrollTop = inputRef.current.scrollHeight;
        //}
    });

    return (
        <div>
            <div
                style={{
                    border: 'solid 1px',
                    padding: '1rem',
                    height: '92vh',
                    overflowY: 'auto'
                }}
                onScroll={setScroll}
                ref={inputRef}
            >
                <Grid data={records}
                      id='id' 
                      scrollable='none'
                >
                    <GridColumn field='executedAt' title='Executed At'
                                cell={p => <td>{new Date(p.dataItem.executedAt).toLocaleString()}</td>}
                    />
                    <GridColumn field='request' title='Request' />
                    <GridColumn field='response' title='Response' />
                    {/*<GridColumn field='parameters' title='Parameters' */}
                    {/*            cell={(p) => <td>{JSON.stringify(p.dataItem.parameters)}</td>}*/}
                    {/*/>*/}
                    <GridColumn field='status' title='Status'
                                cell={p =>
                                    <td style={{backgroundColor: p.dataItem.status !== 'Succeed' ? 'pink' : 'inherited'}}>
                                        {p.dataItem.status}
                                    </td>
                                }
                    />
                </Grid>
            </div>
        </div>
    );
}