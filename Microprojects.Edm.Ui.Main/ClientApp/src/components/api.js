const baseUrl = import.meta.env.ASSET_PREFIX || window.location.origin;

const api = {
    baseUrl: baseUrl,
    auth: `${baseUrl}/api/auth`,
    audits: `${baseUrl}/api/audits`,
    processes: `${baseUrl}/api/processes`,
    devices: `${baseUrl}/api/devices`,
    hosts: `${baseUrl}/api/hosts`,
    workplaces: `${baseUrl}/api/workplaces`,
    operations: `${baseUrl}/api/operations`,
    plugins: `${baseUrl}/api/plugins`,
    profiles: `${baseUrl}/api/profiles`,
    hierarchies: `${baseUrl}/api/hierarchies`
};

export default api;
