import { useCallback, useEffect, useReducer, useState } from 'react'

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
    data: any = null,
): UseFetchResult<T> {
    const [state, setState] = useReducer(
        (
            state: FetchState<T>,
            newState: Partial<FetchState<T>>,
        ): FetchState<T> => ({ ...state, ...newState }),
        {
            loading: true,
        },
    )
    const setData = (data: T) => setState({ data: data })
    const options: RequestInit = {
        method: type,
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        referrerPolicy: 'no-referrer',
        body: data && JSON.stringify(data),
    }

    useEffect(() => {
        const controller = new AbortController()
        async function fetchUrl() {
            try {
                const response = await fetch(url, {
                    ...options,
                    signal: controller.signal,
                })
                const json = await response.json()
                setState({
                    loading: false,
                    data: response.ok && json,
                    error: !response.ok && json.detail,
                })
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    setState({
                        loading: false,
                        data: undefined,
                        error: 'Cannot load the data',
                    })
                }
            }
        }
        // Uncomment next line to make reloading visible
        //setState({ loading: true, data: undefined, error: undefined })
        fetchUrl()
        return () => {
            controller.abort()
        }
    }, [url, ...deps])
    return [[state.data, setData], state.loading, state.error]
}

function useGet<T>(url: string, deps: any[] = []): UseFetchResult<T> {
    return useFetch<T>(url, deps, RequestType.GET)
}

function usePost<T>(
    url: string,
    data: any,
    deps: any[] = [],
): UseFetchResult<T> {
    return useFetch(url, deps, RequestType.POST, data)
}

export { useFetch, useGet, usePost }

export function useRefreshToken(): [number, () => void] {
    const [token, setToken] = useState(0)
    const refresh = useCallback(() => setToken((t) => t + 1), [])
    return [token, refresh]
}

/* new data fetch api */
export const getData = <T>(url: string): Promise<T> => query(url)

export const postData = <T>(url: string, body: any): Promise<T> =>
    query(url, 'POST', body)

export const query = async <T>(
    url: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any,
): Promise<T> => {
    const props: RequestInit = {
        method: method,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    }
    const response = await fetch(url, props)
    const text = await response.text()

    if (!response.ok) {
        // Prefer a server-provided message: ProblemDetails { title, detail }
        // produced by GlobalExceptionHandler for EdmException and similar.
        let message = response.statusText
        if (text) {
            try {
                const problem = JSON.parse(text)
                message =
                    problem?.detail ||
                    problem?.title ||
                    problem?.message ||
                    text ||
                    message
            } catch {
                // Non-JSON body — surface it verbatim.
                message = text
            }
        }
        throw new Error(
            message || `Request failed with status ${response.status}`,
        )
    }

    // Tolerate empty bodies (e.g. 200 OK with no content, or 204 No Content).
    if (response.status === 204 || !text) {
        return undefined as T
    }
    return JSON.parse(text) as T
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
