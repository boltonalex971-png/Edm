import {requestType, useFetch} from './useFetch';

export function usePost<T = any>(url: string | null | undefined, data: any, deps?: React.DependencyList) {
    return useFetch<T>(url, deps, requestType.post, data);
}
