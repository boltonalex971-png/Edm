const baseUrl = import.meta.env.PUBLIC_APP_API_URL || window.location.origin
const appApiUrl = 'api/logistics'

const api = {
    baseUrl: baseUrl,
    auth: `${baseUrl}/api/auth`,
    directories: `${baseUrl}/${appApiUrl}/directories`,
    nomenclatures: `${baseUrl}/${appApiUrl}/nomenclatures`,
    processes: `${baseUrl}/${appApiUrl}/processes`,
    supplies: `${baseUrl}/${appApiUrl}/supplies`,
    items: `${baseUrl}/${appApiUrl}/items`,
    tares: `${baseUrl}/${appApiUrl}/tares`,
    taretypes: `${baseUrl}/${appApiUrl}/taretypes`,
    orders: `${baseUrl}/${appApiUrl}/orders`,
}

export default api
