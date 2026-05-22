import {requestType, useFetch, type UseFetchOptions} from './useFetch';

export function useGet<T = any>(
    url: string | null | undefined,
    deps?: React.DependencyList,
    afterLoadOrOptions?: ((json: any) => T) | UseFetchOptions<T>,
    quiet = false,
) {
    return useFetch<T>(url, deps, requestType.get, null, afterLoadOrOptions, quiet);
}
