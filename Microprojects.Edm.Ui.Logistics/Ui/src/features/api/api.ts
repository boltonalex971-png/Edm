const baseUrl = import.meta.env.PUBLIC_APP_API_URL || window.location.origin;

const api = {
    baseUrl: baseUrl,
    auth: `${baseUrl}/api/auth`,
    directories: `${baseUrl}/api/logistics/directories`,
    processes: `${baseUrl}/api/logistics/processes`,
    nomenclatures: `${baseUrl}/api/logistics/nomenclatures`,
    tares: `${baseUrl}/api/logistics/tares`,
    taretypes: `${baseUrl}/api/logistics/taretypes`
};

export default api;
