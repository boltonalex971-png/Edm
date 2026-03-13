import { useEffect, useReducer } from "react";
import { jwtDecode } from "jwt-decode";

export function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

const requestType = Object.freeze({
    get: "GET",
    post: "POST",
    put: 'PUT',
    delete: 'DELETE'
});

function useFetch(url, deps = [], type = requestType.get, data = null, afterLoad, quiet = false) {
    const [state, setState] = useReducer(
        (state, newState) => ({ ...state, ...newState }),
        { loading: true, data: null, error: null }
    );
    const setData = (data) => setState({ data: data });
    const token = getCookie('X-Auth-Token');
    const options = {
        method: type,
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *client
        body: data && JSON.stringify(data) // body data type must match "Content-Type" header
    }

    useEffect(() => {
        if (!url) {
            setState({ loading: false });
            return;
        }
        const controller = new AbortController();

        async function fetchUrl() {
            try {
                const response = await fetch(url, { ...options, signal: controller.signal });
                const error = !response.ok && `Data request failed with status ${response.status}`;
                const json = response.ok && await response.json();
                const result = afterLoad && (afterLoad(json))
                setState({ loading: false, data: result || json, error: error });
            } catch (error) {
                if (error.name !== 'AbortError') {
                    setState({ loading: false, data: null, error: 'Cannot load the data' });
                }
            }
        }
        // Make reloading visible
        if (!quiet) {
            setState({ loading: true, data: null, error: null })
        } else {
            setState({ loading: true })
        }

        fetchUrl();
        return () => { controller.abort(); }
    }, [url, options.type, quiet, ...deps]);
    return [[state.data, setData], state.loading, state.error];
}

function useGet(url, deps, afterLoad, quiet = false) {
    return useFetch(url, deps, requestType.get, null, afterLoad, quiet);
}


function usePost(url, data, deps) {
    return useFetch(url, deps, requestType.post, data);
}

function getUserFromToken() {
    const token = getCookie('X-Auth-Token');
    if (!token) return null;

    try {
        const decoded = jwtDecode(token);
        const roles = Array.isArray(decoded.Roles) ? decoded.Roles : (decoded.Roles ? [decoded.Roles] : []);
        const divisions = Array.isArray(decoded.Divisions) ? decoded.Divisions : (decoded.Divisions ? [decoded.Divisions] : []);
        
        return {
            name: decoded.sub || decoded.unique_name || decoded.name,
            role: decoded.role || roles[0],
            roles: roles,
            divisions: divisions
        };
    } catch (e) {
        console.error("Failed to decode token", e);
        return null;
    }
}

export { requestType, useFetch, useGet, usePost, getUserFromToken };