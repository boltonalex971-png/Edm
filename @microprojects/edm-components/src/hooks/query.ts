import {getAcceptLanguage} from './acceptLanguage';
import {getCookie} from './getCookie';

/** Promise-based REST helper. Same auth + Accept-Language conventions as
 *  useFetch, but for non-component call sites (event handlers, effect
 *  bodies, redux thunks, etc.). Tolerates 204 No Content and empty bodies.
 *  On failure, surfaces a ProblemDetails detail/title/message string when
 *  the server returns one. */
export async function query<T = any>(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any,
): Promise<T> {
    const token = getCookie('X-Auth-Token');
    const acceptLanguage = getAcceptLanguage();
    const props: RequestInit = {
        method,
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            ...(token && {Authorization: `Bearer ${token}`}),
            ...(acceptLanguage && {'Accept-Language': acceptLanguage}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    };
    const response = await fetch(url, props);
    const text = await response.text();

    if (!response.ok) {
        let message = response.statusText;
        if (text) {
            try {
                const problem = JSON.parse(text);
                message = problem?.detail || problem?.title || problem?.message || text || message;
            } catch {
                // Non-JSON body — surface it verbatim.
                message = text;
            }
        }
        throw new Error(message || `Request failed with status ${response.status}`);
    }

    if (response.status === 204 || !text) {
        return undefined as T;
    }
    return JSON.parse(text) as T;
}

export const getData = <T = any>(url: string): Promise<T> => query<T>(url);

export const postData = <T = any>(url: string, body: any): Promise<T> => query<T>(url, 'POST', body);
