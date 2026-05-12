import { useLocation, useParams } from 'react-router-dom';

/** Returns the current URL with every matched param value stripped — i.e.
 *  the static prefix of the route. For URL `/config/processes/151` matched
 *  against `<Route path=":id">`, returns `/config/processes`. For
 *  `/config/processes/folder/abc-uuid` matched against `<Route path="folder/:id">`,
 *  returns `/config/processes/folder`.
 *
 *  Lifted from Logistics. Use this instead of `useResolvedPath('.')` when
 *  the calling component is a sibling of an inner `<Routes>` block — RR7's
 *  `resolveTo('.')` semantics depend on the closest Route context, which
 *  in nested-Routes layouts can resolve to the wrong level. `useBasePath`
 *  computes the answer from `useLocation()` + `useParams()` directly, so
 *  it's stable regardless of the surrounding router structure. */
export function useBasePath(): string {
    const location = useLocation();
    const params = useParams<Record<string, string>>();
    return Object.values(params).reduce<string>(
        (acc, param) => (param?.length ? acc.replace(`/${param}`, '') : acc),
        location.pathname,
    );
}
