import {useEffect, useReducer} from 'react';
import {getAcceptLanguage} from './acceptLanguage';
import {getCookie} from './getCookie';

export const requestType = Object.freeze({
    get:    'GET',
    post:   'POST',
    put:    'PUT',
    delete: 'DELETE',
} as const);
export type RequestType = (typeof requestType)[keyof typeof requestType];

interface FetchState<T> {
    loading: boolean;
    data: T | null;
    error: string | false | null;
}

type SetData<T> = (data: T) => void;
type AfterLoad<T> = ((json: any) => T) | undefined;

export interface UseFetchOptions<T> {
    afterLoad?: AfterLoad<T>;
    quiet?: boolean;
    credentials?: RequestCredentials;
}

export function useFetch<T = any>(
    url: string | null | undefined,
    deps: React.DependencyList = [],
    type: RequestType = requestType.get,
    data: any = null,
    afterLoadOrOptions?: AfterLoad<T> | UseFetchOptions<T>,
    quietArg = false,
): [[T | null, SetData<T>], boolean, string | false | null] {
    // Back-compat: callers passed (afterLoad, quiet) positionally; new shape
    // accepts an options object as the 5th arg. Detect by typeof.
    const opts: UseFetchOptions<T> =
        typeof afterLoadOrOptions === 'function'
            ? {afterLoad: afterLoadOrOptions, quiet: quietArg}
            : (afterLoadOrOptions ?? {quiet: quietArg});
    const {afterLoad, quiet = false, credentials = 'same-origin'} = opts;

    const [state, setState] = useReducer(
        (s: FetchState<T>, ns: Partial<FetchState<T>>) => ({...s, ...ns}),
        {loading: true, data: null, error: null} as FetchState<T>,
    );
    const setData: SetData<T> = (d) => setState({data: d});
    const token = getCookie('X-Auth-Token');
    const acceptLanguage = getAcceptLanguage();
    const options: RequestInit = {
        method: type,
        mode: 'cors',
        cache: 'no-cache',
        credentials,
        headers: {
            'Content-Type': 'application/json',
            ...(token && {Authorization: `Bearer ${token}`}),
            ...(acceptLanguage && {'Accept-Language': acceptLanguage}),
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
                if (!response.ok) {
                    // Prefer server-provided detail (ProblemDetails from
                    // GlobalExceptionHandler) over a generic status message.
                    let message = `Data request failed with status ${response.status}`;
                    try {
                        const json = await response.json();
                        message = json?.detail || json?.title || json?.message || message;
                    } catch {
                        // Non-JSON body — keep the generic status message.
                    }
                    setState({loading: false, data: null, error: message});
                    return;
                }
                // Tolerate 204 No Content or 200 OK with an empty body —
                // response.json() throws on '', which would surface as the
                // catch-all "Cannot load the data" error otherwise.
                const text = await response.text();
                const json = text ? JSON.parse(text) : null;
                const result = afterLoad ? afterLoad(json) : json;
                setState({loading: false, data: result, error: false});
            } catch (error: any) {
                if (error?.name !== 'AbortError') {
                    setState({loading: false, data: null, error: 'Cannot load the data'});
                }
            }
        }
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
