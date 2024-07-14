import { useEffect, useReducer } from "react";

const requestType = Object.freeze({
    get: "GET",
    post: "POST",
    put: "PUT",
    delete: "DELETE",
});

function useFetch(url, deps = [], type = requestType.get, content = null, data = null) {
    const [state, setState] = useReducer((state, newState) => ({ ...state, ...newState }), {
        loading: true,
        data: null,
        error: null,
    });
    const setData = (d) => setState({ data: d });
    const options = {
        method: type,
        mode: "cors", // no-cors, *cors, same-origin
        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
        credentials: "same-origin", // include, *same-origin, omit
        headers: {
            "Content-Type": "application/json",
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: "follow", // manual, *follow, error
        referrerPolicy: "no-referrer", // no-referrer, *client
        body: content && JSON.stringify(content), // body data type must match "Content-Type" header
    };

    useEffect(() => {
        const controller = new AbortController();
        async function fetchUrl() {
            try {
                let json = data;
                let error;
                if (!json) {
                    const response = await fetch(url, { ...options, signal: controller.signal });
                    error = !response.ok && `Data request failed with status ${response.status}`;
                    json = response.ok && (await response.json());
                }

                setState({ loading: false, data: json, error: error });
            } catch (error) {
                if (error.name !== "AbortError") {
                    setState({ loading: false, data: null, error: "Cannot load the data" });
                }
            }
        }
        /*// Uncomment next line to make reloading visible
        setState({ loading: true, data: null, error: null })*/
        fetchUrl();
        return () => {
            controller.abort();
        };
    }, [url, options.type, ...deps]);
    return [state.data, setData, state.loading, state.error];
}

function useGet(url, deps) {
    return useFetch(url, deps, requestType.get);
}

function usePost(url, data, deps) {
    return useFetch(url, deps, requestType.post, data);
}

export { requestType, useFetch, useGet, usePost };
