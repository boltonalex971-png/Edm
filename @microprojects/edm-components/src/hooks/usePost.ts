import {requestType, useFetch} from './useFetch';

export function usePost(url: string | null | undefined, data: any, deps?: React.DependencyList) {
    return useFetch(url, deps, requestType.post, data);
}
