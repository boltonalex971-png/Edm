import {useEffect, useReducer} from 'react';
import {getCookie} from './getCookie';

export const requestType = Object.freeze({
    get:    'GET',
    post:   'POST',
    put:    'PUT',
    delete: 'DELETE',
} as const);
export type RequestType = (typeof requestType)[keyof typeof requestType];

interface FetchState {
    loading: boolean;
    data: any;
    error: string | false | null;
}

type SetData = (data: any) => void;
type AfterLoad = ((json: any) => any) | undefined;

export function useFetch(
    url: string | null | undefined,
    deps: React.DependencyList = [],
    type: RequestType = requestType.get,
    data: any = null,
    afterLoad?: AfterLoad,
    quiet = false
): [[any, SetData], boolean, string | false | null] {
    const [state, setState] = useReducer(
        (s: FetchState, ns: Partial<FetchState>) => ({...s, ...ns}),
        {loading: true, data: null, error: null} as FetchState
    );
    const setData: SetData = (d) => setState({data: d});
    const token = getCookie('X-Auth-Token');
    const options: RequestInit = {
        method: type,
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            ...(token && {Authorization: `Bearer ${token}`}),
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: data && JSON.stringify(data),
    };

    useEffect(() => {
        if (!url) {
            setState({loading: false});
            return;
        }
        const controller = new AbortController();

        async function fetchUrl() {
            try {
                const response = await fetch(url as string, {...options, signal: controller.signal});
                const error = !response.ok && `Data request failed with status ${response.status}`;
                const json = response.ok && (await response.json());
                const result = afterLoad && afterLoad(json);
                setState({loading: false, data: result || json, error});
            } catch (error: any) {
                if (error?.name !== 'AbortError') {
                    setState({loading: false, data: null, error: 'Cannot load the data'});
                }
            }
        }
        // Make reloading visible
        if (!quiet) {
            setState({loading: true, data: null, error: null});
        } else {
            setState({loading: true});
        }

        fetchUrl();
        return () => {
            controller.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, type, quiet, ...deps]);
    return [[state.data, setData], state.loading, state.error];
}
