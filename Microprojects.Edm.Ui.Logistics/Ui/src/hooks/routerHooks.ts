import { useLocation, useParams } from 'react-router-dom'

const useRouteMatch = () => {
    const params = useParams<Record<string, string | undefined>>()
    const { pathname } = useLocation()
    const url = params?.['*']?.length
        ? pathname.replace(`/${params['*']}`, '')
        : pathname
    const name = pathname.replace(`${url}`, '')
    return { path: url, name }
}

const useBasePath = () => {
    const location = useLocation()
    const params = useParams<Record<string, string>>()
    const path = Object.values(params).reduce(
        (path: string, param) =>
            param?.length ? path.replace(`/${param}`, '') : path,
        location.pathname,
    )
    return { path }
}

export { useBasePath, useRouteMatch }
