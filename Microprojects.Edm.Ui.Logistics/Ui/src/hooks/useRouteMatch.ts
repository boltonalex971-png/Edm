import { useLocation, useParams } from 'react-router-dom'

export const useRouteMatch = () => {
    const params = useParams<Record<string, string | undefined>>()
    const { pathname } = useLocation()
    const url = params?.['*']?.length
        ? pathname.replace(`/${params['*']}`, '')
        : pathname
    const name = pathname.replace(`${url}`, '')
    return { path: url, name }
}
