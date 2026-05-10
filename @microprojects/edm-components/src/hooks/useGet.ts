import {requestType, useFetch} from './useFetch';

export function useGet(
    url: string | null | undefined,
    deps?: React.DependencyList,
    afterLoad?: (json: any) => any,
    quiet = false
) {
    return useFetch(url, deps, requestType.get, null, afterLoad, quiet);
}
