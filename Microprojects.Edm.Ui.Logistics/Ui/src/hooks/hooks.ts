import { useEffect, useReducer } from 'react'

enum RequestType {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE',
}
type Error = string | boolean | undefined
type UseFetchResult<T> = [[T | undefined, (data: T) => void], boolean, Error]
type FetchState<T> = {
    loading: boolean
    data?: T | undefined
    error?: Error
}

function useFetch<T>(
    url: string,
    deps: any[] = [],
    type: RequestType = RequestType.GET,
    data : any = null
): UseFetchResult<T> {
    const [state, setState] = useReducer(
        (state: FetchState<T>, newState: Partial<FetchState<T>>): FetchState<T> => ({ ...state, ...newState }),
        {
            loading: true,
        }
    )
    const setData = (data: T) => setState({ data: data })
    const options: RequestInit = {
        method: type,
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        //credentials: 'include', // include, *same-origin, omit
        headers: {
            'Content-Type': 'application/json',
        },
        //redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *client
        body: data && JSON.stringify(data) // body data type must match "Content-Type" header
    }

    useEffect(() => {
        const controller = new AbortController()
        async function fetchUrl() {
            try {
                const response = await fetch(url, { ...options, signal: controller.signal })
                const json = await response.json()
                setState({ loading: false, data: response.ok && json, error: !response.ok && json.detail })
            } catch (err : any) {
                if (err.name !== 'AbortError') {
                    setState({ loading: false, data: undefined, error: 'Cannot load the data' })
                }
            }
        }
        // Uncomment next line to make reloading visible
        //setState({ loading: true, data: undefined, error: undefined })
        fetchUrl()
        return () => {
            controller.abort()
        }
    }, [...deps])
    return [[state.data, setData], state.loading, state.error]
}

function useGet<T>(url: string, deps: any[] = []): UseFetchResult<T> {
    return useFetch<T>(url, deps, RequestType.GET)
}

function usePost<T>(url: string, data: any, deps: [] = []): UseFetchResult<T> {
    return useFetch(url, deps, RequestType.POST, data)
}

export { useFetch, useGet, usePost }

/* new data fetch api */
export const getData = <T>(url: string): Promise<T> => query(url)

export const postData = <T>(url: string, body: any): Promise<T> => query(url, 'POST', body)

export const query = async <T>(url: string, method: 'GET' | 'POST' = 'GET', body?: any): Promise<T> => {
    const props: RequestInit = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    }
    const response = await fetch(url, props)
    if (!response.ok) {
        throw new Error(response.statusText)
    }
    const data = response.ok && (await response.json())
    return data as T
}

export function startLoading(...elements: HTMLElement[]) {
    for (const el of elements) {
        el?.classList.add('app-loading')
    }
}

export function stopLoading(...elements: HTMLElement[]) {
    for (const el of elements) {
        el?.classList.remove('app-loading')
    }
}
